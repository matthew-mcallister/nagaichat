import { errorHandler } from '@/api/middleware'
import apiRouter from '@/api/routes/_index'
import { parseInteger } from '@/lib/util'
import cors from 'cors'
import express from 'express'

const app = express()
const port = parseInteger(process.env.EXPRESS_PORT || '3001')

app.use(express.json())

const corsOptions = {
  origin: function (origin: any, callback: any) {
    // Echo the requesting origin back to the browser dynamically
    callback(null, origin)
  },
  credentials: true,
}
app.use(cors(corsOptions))

app.use('/api', apiRouter)

app.use(errorHandler)

app.listen(port, () => {
  console.log(`Express server listening on port ${port}`)
})
