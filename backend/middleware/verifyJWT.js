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
            if (err) return res.status(403).json({ message: 'Forbidden' })
            
            // ✅ Attach full user info
            req.user = decoded.UserInfo      // includes _id, username, roles
            req.userId = decoded.UserInfo._id // optional shortcut
            req.roles = decoded.UserInfo.roles
            next()

            
        }
    )
}

module.exports = verifyJWT 