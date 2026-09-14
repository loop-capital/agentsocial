/**
 * Risk scoring algorithm for spam detection
 */

/**
 * Calculate spam risk score based on report data
 * @param {object} reportData - Aggregated report data for a phone number
 * @param {object} options - Scoring options
 * @returns {object} Risk assessment result
 */
function calculateRiskScore(reportData, options = {}) {
  const {
    totalReports = 0,
    recentReports = 0, // Reports in last 30 days
    reportTypes = [],
    firstSeen = null,
    lastSeen = null,
    patternGroups = 0,
    uniqueVictims = 0,
    attorneyMatches = 0,
    falsePositiveReports = 0,
  } = reportData;

  const {
    sensitivity = 'medium', // 'low', 'medium', 'high'
    context = 'unknown', // 'call', 'text', 'unknown'
  } = options;

  // Base score starts at 0
  let score = 0;
  const factors = [];

  // Factor 1: Report frequency (0-40 points)
  const frequencyScore = Math.min(totalReports * 4, 40);
  score += frequencyScore;
  if (frequencyScore > 0) {
    factors.push({
      name: 'report_frequency',
      contribution: frequencyScore,
      details: `${totalReports} total reports`,
    });
  }

  // Factor 2: Recency (0-25 points)
  // More recent = higher score
  const daysSinceLastReport = lastSeen 
    ? Math.floor((Date.now() - new Date(lastSeen).getTime()) / (1000 * 60 * 60 * 24))
    : null;
  
  let recencyScore = 0;
  if (daysSinceLastReport !== null) {
    if (daysSinceLastReport <= 1) recencyScore = 25;
    else if (daysSinceLastReport <= 7) recencyScore = 20;
    else if (daysSinceLastReport <= 30) recencyScore = 15;
    else if (daysSinceLastReport <= 90) recencyScore = 10;
    else recencyScore = 5;
  }
  score += recencyScore;
  if (recencyScore > 0) {
    factors.push({
      name: 'recency',
      contribution: recencyScore,
      details: `Last report ${daysSinceLastReport} days ago`,
    });
  }

  // Factor 3: Report velocity (0-20 points)
  // Recent spike in reports
  const velocityScore = Math.min(recentReports * 5, 20);
  score += velocityScore;
  if (velocityScore > 0) {
    factors.push({
      name: 'velocity',
      contribution: velocityScore,
      details: `${recentReports} reports in last 30 days`,
    });
  }

  // Factor 4: Pattern diversity (0-10 points)
  // Multiple pattern groups suggest organized campaign
  const patternScore = Math.min(patternGroups * 5, 10);
  score += patternScore;
  if (patternScore > 0) {
    factors.push({
      name: 'pattern_diversity',
      contribution: patternScore,
      details: `Part of ${patternGroups} spam campaigns`,
    });
  }

  // Factor 5: Victim spread (0-10 points)
  // More unique victims = more likely spam
  const victimScore = Math.min(Math.floor(uniqueVictims / 2), 10);
  score += victimScore;
  if (victimScore > 0) {
    factors.push({
      name: 'victim_spread',
      contribution: victimScore,
      details: `${uniqueVictims} unique victims reported`,
    });
  }

  // Factor 6: Attorney validation bonus (0-5 points)
  // If attorneys have matched this number, it's likely legitimate spam
  const attorneyScore = Math.min(attorneyMatches * 2, 5);
  score += attorneyScore;
  if (attorneyScore > 0) {
    factors.push({
      name: 'attorney_validation',
      contribution: attorneyScore,
      details: `${attorneyMatches} attorney matches`,
    });
  }

  // Factor 7: False positive penalty (-15 to 0 points)
  const fpPenalty = Math.min(falsePositiveReports * -5, -15);
  score += fpPenalty;
  if (fpPenalty < 0) {
    factors.push({
      name: 'false_positive_adjustment',
      contribution: fpPenalty,
      details: `${falsePositiveReports} false positive reports`,
    });
  }

  // Factor 8: Report type severity (0-10 points)
  const severeTypes = ['auto-dialer', 'after-opt-out', 'spoofed'];
  const severeCount = reportTypes.filter(t => severeTypes.includes(t)).length;
  const typeScore = Math.min(severeCount * 3, 10);
  score += typeScore;
  if (typeScore > 0) {
    factors.push({
      name: 'violation_severity',
      contribution: typeScore,
      details: `Severe violation types detected`,
    });
  }

  // Apply sensitivity multiplier
  const sensitivityMultipliers = {
    low: 0.7,
    medium: 1.0,
    high: 1.2,
  };
  const multiplier = sensitivityMultipliers[sensitivity] || 1.0;
  score = Math.round(score * multiplier);

  // Cap at 100
  score = Math.min(score, 100);
  score = Math.max(score, 0); // Ensure non-negative

  // Determine risk level and recommendation
  const thresholds = getThresholds(sensitivity);
  const { level, recommendation, action } = determineAction(score, thresholds, context);

  return {
    score,
    level,
    recommendation,
    action,
    sensitivity,
    factors,
    metadata: {
      totalReports,
      recentReports,
      firstSeen,
      lastSeen,
      reportTypes: [...new Set(reportTypes)],
      uniqueVictims,
      attorneyMatches,
      falsePositiveReports,
    },
  };
}

/**
 * Get thresholds based on sensitivity
 */
function getThresholds(sensitivity) {
  const configs = {
    low: {
      low: 40,
      medium: 60,
      high: 80,
      block: 95,
    },
    medium: {
      low: 30,
      medium: 60,
      high: 85,
      block: 90,
    },
    high: {
      low: 25,
      medium: 50,
      high: 75,
      block: 85,
    },
  };

  return configs[sensitivity] || configs.medium;
}

/**
 * Determine action based on score and thresholds
 */
function determineAction(score, thresholds, context) {
  let level, recommendation, action;

  if (score >= thresholds.block) {
    level = 'critical';
    recommendation = 'BLOCK';
    action = context === 'call' ? 'block_call' : 
             context === 'text' ? 'block_text' : 'block_all';
  } else if (score >= thresholds.high) {
    level = 'high';
    recommendation = 'LIKELY_BLOCK';
    action = context === 'call' ? 'screen_call' : 
             context === 'text' ? 'filter_text' : 'warn_user';
  } else if (score >= thresholds.medium) {
    level = 'medium';
    recommendation = 'CAUTION';
    action = 'warn_user';
  } else if (score >= thresholds.low) {
    level = 'low';
    recommendation = 'LIKELY_SAFE';
    action = 'allow';
  } else {
    level = 'safe';
    recommendation = 'SAFE';
    action = 'allow';
  }

  return { level, recommendation, action };
}

/**
 * Get explanation text for risk level
 */
function getRiskExplanation(level) {
  const explanations = {
    safe: 'No suspicious activity detected.',
    low: 'Minimal risk detected. Monitor optional.',
    medium: 'Some suspicious patterns. Exercise caution.',
    high: 'Multiple reports indicate likely spam/fraud.',
    critical: 'High-confidence spam/fraud. Strong recommendation to block.',
  };

  return explanations[level] || 'Unknown risk level.';
}

module.exports = {
  calculateRiskScore,
  getThresholds,
  determineAction,
  getRiskExplanation,
};