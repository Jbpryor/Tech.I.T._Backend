const User = require('../models/User')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const asyncHandler = require('express-async-handler')


// @desc Login
// @route POST /auth
// @access Public
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body

    if (!email || !password) {
        return res.status(400).json({ message: 'All fields are required' })
    }

    const user = await User.findOne({ email }).exec()

    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' })
    }

    const match = await bcrypt.compare(password, user.password)

    if (!match) return res.status(401).json({ message: 'Unauthorized' })

    const accessToken = jwt.sign(
        {
            "UserInfo": {
                "email": user.email,
                "role": user.role,
                "userName": user.name.first + ' ' + user.name.last,
                "userId": user._id
            }
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '1d' }
    )

    const refreshToken = jwt.sign(
        { "email": user.email },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '7d' }
    )

    // Create secure cookie with refresh token
    res.cookie('jwt', refreshToken, {
        httpOnly: true, // accessible only by web server
        secure: true, // https
        sameSite: 'None', //cross-site cooie
        maxAge: 7 * 24 * 60 * 60 * 1000 // cookie expiry: set to match refreshToken
    })

    // Send accessToken containing username and role
    res.json({ accessToken, role: user.role })
})

// @desc Refresh
// @route GET /auth/refresh
// @access Public - because access token has expired
const refresh = (req, res) => {
    const cookies = req.cookies

    if (!cookies?.jwt) return res.status(401).json({ message: 'Unauthorized' })

    const refreshToken = cookies.jwt

    jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        async (err, decoded) => {
            if (err) return res.status(403).json({ message: 'Forbidden' })

            const user = await User.findOne({ email: decoded.email })

            if (!user) return res.status(401).json({ message: 'Unauthorized' })

            const accessToken = jwt.sign(
                {
                    "UserInfo": {
                        "email": user.email,
                        "role": user.role,
                        "userName": user.name.first + ' ' + user.name.last,
                        "userId": user._id
                    }
                },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '15m' }
            )

            res.json({ accessToken })
        }
    )
}

// @desc Logout
// @route POST /auth/logout
// @access Public - just to clear cookie if exists
const logout = (req, res) => {
    const cookies = req.cookies
    if (!cookies?.jwt) return res.sendStatus(204) // No content
    res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true })
    res.json({ message: 'Cookie cleared' })
}

module.exports = {
    login,
    refresh,
    logout
}