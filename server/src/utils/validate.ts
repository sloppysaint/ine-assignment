import Joi from 'joi'

export const schemas = {
  signup: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  createAuction: Joi.object({
    title: Joi.string().min(3).max(200).required(),
    description: Joi.string().min(10).max(2000).required(),
    startingPrice: Joi.number().positive().required(),
    bidIncrement: Joi.number().positive().required(),
    goLiveAt: Joi.date().iso().greater('now').required(),
    durationMinutes: Joi.number().min(1).max(1440).required()
  }),

  placeBid: Joi.object({
    amount: Joi.number().positive().required()
  }),

  sellerDecision: Joi.object({
    action: Joi.string().valid('ACCEPT', 'REJECT', 'COUNTER').required(),
    counterPrice: Joi.when('action', {
      is: 'COUNTER',
      then: Joi.number().positive().required(),
      otherwise: Joi.optional()
    })
  }),

  counterResponse: Joi.object({
    accept: Joi.boolean().required()
  })
}

export function validate(schema: Joi.ObjectSchema) {
  return (req: any, res: any, next: any) => {
    const { error } = schema.validate(req.body)
    if (error) {
      return res.status(400).json({ error: error.details[0].message })
    }
    next()
  }
}