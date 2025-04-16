const axios = require('axios');

exports.getChatResponse = async (req, res) => {
  const { message } = req.body;

  try {
    // Set a timeout for the API request to avoid waiting indefinitely
    const response = await axios.post(
      process.env.OLLAMA_API,
      { message },
      { timeout: 10000 } // Timeout after 10 seconds
    );

    // Check if the response is empty or invalid
    if (!response.data || !response.data.response) {
      return res.status(400).json({ error: 'Invalid response from chat API' });
    }

    // Enhance the response with metadata
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      userMessage: message,
      ollamaResponse: response.data.response,
      rawResponse: response.data,
    });
  } catch (error) {
    console.error("Error in chat API:", error);

    // Handle specific errors like network issues or timeouts
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({ error: 'Request to chat API timed out' });
    }

    // Handle other errors (e.g., 4xx or 5xx from Ollama)
    if (error.response) {
      return res.status(error.response.status).json({
        error: `Chat API responded with error: ${error.response.data.message || 'Unknown error'}`
      });
    }

    // Generic error handler if something unexpected happens
    res.status(500).json({ error: 'Failed to get response from Ollama' });
  }
};