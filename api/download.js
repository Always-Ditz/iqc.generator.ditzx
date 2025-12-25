// api/download.js - Vercel Serverless Function for Download

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

        // Get image buffer
        const imageBuffer = await response.arrayBuffer();

        // Create filename with timestamp
        const timestamp = Date.now();
        const filename = `iqc-${timestamp}.png`;

        // Set headers for download
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', imageBuffer.byteLength);
        res.setHeader('Cache-Control', 'no-cache');

        // Send image as download
        return res.status(200).send(Buffer.from(imageBuffer));

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ 
            error: 'Failed to download image',
            message: error.message 
        });
    }
    }
