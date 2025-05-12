import { Router } from 'express'
// Api Routes
const router = Router()

router.get('/login', (req, res) => {
  res.send('Completed')
})

router.get('/register', (req, res) => {
  res.send('Completed')
})

router.get('/logout', (req, res) => {
  res.send('Completed')
})

export default router
