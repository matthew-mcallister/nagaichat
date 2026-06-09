import cors from 'cors'
import { errorHandler } from '@/server/middleware'
import apiRouter from '@/server/routes/_index'
import express from 'express'

const app = express()
const port = parseInt(process.env.EXPRESS_PORT || '3001', 10)

app.use(express.json())
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }))

app.use('/api', apiRouter)

app.use(errorHandler)

app.listen(port, () => {
  console.log(`Express server listening on port ${port}`)
})
