const jwt = require('jsonwebtoken')

const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization
    
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' })
    }

    const token = authHeader.split(' ')[1]

    jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET,
      (err, decoded) => {
          if (err) {
              console.error('JWT Verification Error:', err);
              return res.status(403).json({ message: 'Forbidden' });
          }
        //   console.log('Decoded Token:', decoded);
          req.email = decoded.UserInfo.email;
          req.role = decoded.UserInfo.role;
          req.userName = decoded.UserInfo.userName;
          req.userId = decoded.UserInfo.userId
          next();
      }
  );
}

module.exports = verifyJWT