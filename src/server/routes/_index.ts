import { Router } from 'express'
import presetsRouter from './presets'

const apiRouter = Router()

apiRouter.use('/presets', presetsRouter)

export default apiRouter
