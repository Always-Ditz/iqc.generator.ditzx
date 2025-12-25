// api/generate.js - Vercel Serverless Function

// Global cooldown state (in-memory)
let lastRequestTime = 0;
const COOLDOWN_MS = 60000; // 1 minute

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // Check global cooldown
        const now = Date.now();
        const timeSinceLastRequest = now - lastRequestTime;
        
        if (timeSinceLastRequest < COOLDOWN_MS) {
            const remainingTime = Math.ceil((COOLDOWN_MS - timeSinceLastRequest) / 1000);
            return res.status(429).json({ 
                error: 'Cooldown active',
                message: `Mohon tunggu ${remainingTime} detik lagi sebelum generate lagi`,
                remainingSeconds: remainingTime
            });
        }

        // Get query parameters
        const { time, messageText, carrierName, batteryPercentage, signalStrength } = req.query;

        // Validate required fields
        if (!time || !messageText) {
            return res.status(400).json({ 
                error: 'Missing required parameters: time and messageText' 
            });
        }

        // Build external API URL
        const apiUrl = `https://brat.siputzx.my.id/iphone-quoted?time=${encodeURIComponent(time)}&messageText=${encodeURIComponent(messageText)}&carrierName=${encodeURIComponent(carrierName || 'INDOSAT OOREDOO')}&batteryPercentage=${encodeURIComponent(batteryPercentage || '8')}&signalStrength=${encodeURIComponent(signalStrength || '4')}`;

        // Fetch from external API
        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`External API error: ${response.status}`);
        }

        // Update last request time (cooldown activated)
        lastRequestTime = now;

        // Get image buffer
        const imageBuffer = await response.arrayBuffer();

        // Set headers for image
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', 'inline; filename="iqc-generated.png"');
        res.setHeader('Cache-Control', 'public, max-age=3600');

        // Send image
        return res.status(200).send(Buffer.from(imageBuffer));

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ 
            error: 'Failed to generate image',
            message: error.message 
        });
    }
}