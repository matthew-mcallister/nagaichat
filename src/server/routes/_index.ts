import { Router } from 'express'
import integrationsRouter from './integrations'
import presetsRouter from './presets'

const apiRouter = Router()

apiRouter.use('/integrations', integrationsRouter)
apiRouter.use('/presets', presetsRouter)

export default apiRouter
