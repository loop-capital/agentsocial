const http = require('http');

const PORT = process.env.MUSE_PORT || 3456;

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const url = new URL(req.url, `http://${req.headers.host}`);
  
  // Health check
  if (url.pathname === '/muse/health' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: "connected",
      version: "1.0.0",
      salon: "PLEIJ Salon",
      capabilities: ["booking", "availability_check", "service_inquiry", "pricing"]
    }));
    return;
  }
  
  // Main query endpoint
  if (url.pathname === '/muse/query' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { intent } = JSON.parse(body);
        
        switch (intent) {
          case "get_services":
            res.writeHead(200);
            res.end(JSON.stringify({
              success: true,
              data: {
                services: [
                  { name: "Haircut", duration: 45, price: "$45+" },
                  { name: "Color & Highlights", duration: 120, price: "$120+" },
                  { name: "Balayage", duration: 180, price: "$200+" },
                  { name: "Extensions", duration: 240, price: "$300+" },
                  { name: "Treatments", duration: 60, price: "$60+" },
                  { name: "Bridal Styling", duration: 120, price: "$150+" }
                ]
              }
            }));
            return;
            
          case "get_hours":
            res.writeHead(200);
            res.end(JSON.stringify({
              success: true,
              data: {
                hours: {
                  monday: "9:00-19:00",
                  tuesday: "9:00-19:00",
                  wednesday: "9:00-19:00",
                  thursday: "9:00-19:00",
                  friday: "9:00-19:00",
                  saturday: "9:00-17:00",
                  sunday: "closed"
                }
              }
            }));
            return;
            
          case "get_location":
            res.writeHead(200);
            res.end(JSON.stringify({
              success: true,
              data: {
                name: "PLEIJ Salon",
                address: "1279 Polaris Parkway, Columbus, OH 43240",
                phone: "614-665-1751",
                website: "https://pleijsalon.com"
              }
            }));
            return;
            
          case "check_availability":
            res.writeHead(200);
            res.end(JSON.stringify({
              success: true,
              data: {
                available_slots: [
                  { date: "2026-09-28", time: "10:00", duration: 60 },
                  { date: "2026-09-28", time: "14:00", duration: 60 },
                  { date: "2026-09-29", time: "11:00", duration: 60 }
                ]
              }
            }));
            return;
            
          case "book_appointment":
            res.writeHead(200);
            res.end(JSON.stringify({
              success: true,
              requires_approval: true,
              message: "Booking request received. Awaiting confirmation.",
              data: { booking_id: "pleij_" + Date.now() }
            }));
            return;
            
          default:
            res.writeHead(400);
            res.end(JSON.stringify({ success: false, message: "Unknown intent: " + intent }));
            return;
        }
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, message: "Invalid JSON" }));
      }
    });
    return;
  }
  
  // Salon data endpoint
  if (url.pathname.match(/^\/muse\/salon\/[^\/]+$/) && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({
      id: url.pathname.split('/').pop(),
      name: "PLEIJ Salon",
      industry: "hair salon",
      location: {
        address: "1279 Polaris Parkway, Columbus, OH 43240",
        city: "Columbus",
        state: "OH",
        zip: "43240"
      },
      contact: {
        phone: "614-665-1751",
        email: "info@pleijsalon.com",
        website: "https://pleijsalon.com"
      },
      hours: {
        monday: "9:00-19:00",
        tuesday: "9:00-19:00",
        wednesday: "9:00-19:00",
        thursday: "9:00-19:00",
        friday: "9:00-19:00",
        saturday: "9:00-17:00",
        sunday: "closed"
      },
      services: [
        { name: "Haircut", duration: 45, price: "$45+", category: "cuts" },
        { name: "Color & Highlights", duration: 120, price: "$120+", category: "color" },
        { name: "Balayage", duration: 180, price: "$200+", category: "color" },
        { name: "Extensions", duration: 240, price: "$300+", category: "extensions" },
        { name: "Treatments", duration: 60, price: "$60+", category: "treatments" },
        { name: "Bridal Styling", duration: 120, price: "$150+", category: "events" }
      ],
      booking: {
        requires_approval: true,
        advance_notice_hours: 24,
        cancellation_policy: "24 hours notice required"
      }
    }));
    return;
  }
  
  // 404 for everything else
  res.writeHead(404);
  res.end(JSON.stringify({ success: false, message: "Not found" }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🎭 Muse connector running on http://0.0.0.0:${PORT}`);
  console.log(`📍 PLEIJ Salon endpoints ready for Meta Muse`);
  console.log(`📋 Available endpoints:`);
  console.log(`   GET  /muse/health`);
  console.log(`   POST /muse/query`);
  console.log(`   GET  /muse/salon/:id`);
});
