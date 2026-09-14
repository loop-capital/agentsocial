import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/a2a/reputation - Get reputation for an agent
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const agentId = searchParams.get("agentId");
    const days = parseInt(searchParams.get("days") || "30");
    const limit = parseInt(searchParams.get("limit") || "50");

    if (!agentId) {
      return NextResponse.json(
        { error: "agentId is required" },
        { status: 400 }
      );
    }

    const agent = await prisma.a2AAgent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      );
    }

    const since = new Date();
    since.setDate(since.getDate() - days);

    const [events, total] = await Promise.all([
      prisma.reputationEvent.findMany({
        where: {
          agentId,
          createdAt: { gte: since },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.reputationEvent.count({
        where: {
          agentId,
          createdAt: { gte: since },
        },
      }),
    ]);

    // Calculate current score based on recent events
    const recentEvents = events.filter(e => e.createdAt >= since);
    let scoreAdjustment = 0;
    let totalWeight = 0;

    for (const event of recentEvents) {
      const ageInDays = (Date.now() - new Date(event.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      const weight = Math.exp(-ageInDays / 30); // Exponential decay over 30 days
      scoreAdjustment += event.score * weight;
      totalWeight += weight;
    }

    const currentScore = totalWeight > 0 
      ? Math.max(0, Math.min(100, 50 + (scoreAdjustment / totalWeight))) 
      : 50;

    return NextResponse.json({
      agentId,
      currentScore,
      baseScore: agent.reputationScore,
      recentEvents,
      periodDays: days,
      totalEvents: total,
      summary: {
        positive: events.filter(e => e.score > 0).length,
        negative: events.filter(e => e.score < 0).length,
        neutral: events.filter(e => e.score === 0).length,
      }
    });
  } catch (error) {
    console.error("Error fetching reputation:", error);
    return NextResponse.json(
      { error: "Failed to fetch reputation" },
      { status: 500 }
    );
  }
}

// POST /api/a2a/reputation - Add a reputation event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      agentId,
      type,
      score,
      transactionId,
      description,
      verified = false,
    } = body;

    if (!agentId || type === undefined || score === undefined) {
      return NextResponse.json(
        { error: "agentId, type, and score are required" },
        { status: 400 }
      );
    }

    const agent = await prisma.a2AAgent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      );
    }

    // Validate event type
    const validTypes = [
      "COMPLETION",
      "ON_TIME_DELIVERY",
      "QUALITY_RATING",
      "DISPUTE_RESOLVED",
      "DISPUTE_LOST",
      "RESPONSE_TIME",
    ];

    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid event type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Create the event
    const event = await prisma.reputationEvent.create({
      data: {
        agentId,
        type,
        score,
        transactionId,
        description,
        verified,
      },
    });

    // Update agent's reputation score
    const newScore = Math.max(0, Math.min(100, agent.reputationScore + score));
    
    await prisma.a2AAgent.update({
      where: { id: agentId },
      data: {
        reputationScore: newScore,
        // Update other metrics based on event type
        ...(type === "COMPLETION" && {
          completionRate: Math.min(100, 
            (agent.completionRate * agent.totalTransactions + 100) / (agent.totalTransactions + 1)
          ),
          totalTransactions: agent.totalTransactions + 1
        }),
        ...(type === "DISPUTE_RESOLVED" && {
          completionRate: Math.min(100, 
            (agent.completionRate * agent.totalTransactions + 100) / (agent.totalTransactions + 1)
          ),
        }),
        ...(type === "DISPUTE_LOST" && {
          completionRate: Math.max(0, 
            (agent.completionRate * agent.totalTransactions) / (agent.totalTransactions + 1)
          ),
          totalTransactions: agent.totalTransactions + 1
        }),
      },
    });

    // Log activity
    await prisma.a2AActivityLog.create({
      data: {
        agentId,
        type: "REPUTATION_EVENT_ADDED",
        title: `Reputation event: ${type} (${score > 0 ? "+" : ""}${score})`,
        description: description || `Reputation event recorded`,
        metadata: {
          eventId: event.id,
          type,
          score,
          transactionId,
        },
      },
    });

    return NextResponse.json({ event, newScore: newScore }, { status: 201 });
  } catch (error) {
    console.error("Error adding reputation event:", error);
    return NextResponse.json(
      { error: "Failed to add reputation event" },
      { status: 500 }
    );
  }
}
