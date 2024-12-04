const { OAuth2Client } = require("google-auth-library");
const axios = require("axios");

const gmailOAuth2Client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Middleware to check authentication
const auth = async (req, res, next) => {
  try {
    const token = (req.headers['authorization'] || '').replace(/^Bearer\s+/, '').trim();

    if (!token) {

      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    // Fetching the OpenID Connect discovery document
    const discoveryURL = "https://accounts.google.com/.well-known/openid-configuration";
    const response = await axios.get(discoveryURL);
    const discoveryDocument = response.data;

    // Verify the token using Google's OAuth2Client
    const ticket = await gmailOAuth2Client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    // Check if the issuer matches the one from the discovery document
    if (!payload || !payload.iss || payload.iss !== discoveryDocument.issuer.replace(/^https:\/\//, '')) {
      throw new Error("invalid issuer");
    }

    req.user = {
      userId: payload['sub'],
      email: payload['email'],
      name: payload['name'],
    };

    next();
  } catch (error) {
    console.error("Invalid Token or Expired Token", error.message);
    res.status(401).json({ message: 'Unauthorized: Token verification failed' });
  }
};

module.exports = {
  auth,
};
