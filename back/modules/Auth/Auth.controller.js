import { Router } from 'express'
import AuthService from './Auth.service.js'

const router = Router()

router.post('/login', (req, res) => {
  try {
    AuthService.login(req, res)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: err.message })
  }
})

router.post('/register', (req, res) => {
  try {
    AuthService.register(req, res)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: err.message })
  }
})

router.post('/logout', (req, res) => {
  try {
    AuthService.register(req, res)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: err.message })
  }
})

export default router