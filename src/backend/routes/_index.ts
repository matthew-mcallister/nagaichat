import { Router } from 'express'
import integrationsRouter from './integrations'
import presetsRouter from './presets'
import sessionsRouter from './sessions'

const apiRouter = Router()

apiRouter.use('/integrations', integrationsRouter)
apiRouter.use('/presets', presetsRouter)
apiRouter.use('/sessions', sessionsRouter)

export default apiRouter
