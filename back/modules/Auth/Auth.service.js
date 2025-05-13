class AuthService {
  login(req, res) {
    const { username, password } = req.body ?? {}
    if (username === 'admin' && password === 'admin') {
      return res.send({
        access: 'access_token',
        refresh: 'refresh_token'
      })
    }
    return res.status(401).json({ message: 'Invalid username or password' })
  }

  register(req, res) {
    const { username, password } = req.body ?? {}
    return res.status(401).json({ message: 'Invalid username or password' })
  }

  logout(req, res) {
    const token = ''
    return res.status(500)
  }
}

export default new AuthService()