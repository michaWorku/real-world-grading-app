import boom from '@hapi/boom'
import Hapi from '@hapi/hapi'
import Joi, { options } from '@hapi/joi'

const userInputValidator = Joi.object({
    firstName: Joi.string().alter({
        create: schema => schema.required(),
        update: schema => schema.optional()
    }),
    lastName: Joi.string().alter({
        create: schema => schema.required(),
        update: schema => schema.optional()
    }),
    email:
        Joi.string().email().alter({
            create: schema => schema.required(),
            update: schema => schema.optional()
        }),
    social: Joi.object({
        facebook: Joi.string().optional(),
        twitter: Joi.string().optional(),
        github: Joi.string().optional(),
        website: Joi.string().optional(),
    }).optional(),
})

const createUserValidator = userInputValidator.tailor('create')
const updateUserValidator = userInputValidator.tailor('update')

const usersPlugin = {
    name: 'app/users',
    dependencies: ['prisma'],
    register: async (server: Hapi.Server) => {
        server.route([
            {
                method: 'POST',
                path: '/users',
                handler: createUserHandler,
                options: {
                    validate: {
                        payload: createUserValidator,
                        failAction: (request, h, err) => {
                            console.error(err);
                            throw err
                        },
                    },
                }
            },
            {
                method: 'GET',
                path: '/users/{userId}',
                options: {
                    validate: {
                        params: Joi.object({
                            userId: Joi.number().integer()
                        }),
                        failAction: (request, h, err) => {
                            console.error(err);
                            throw err
                        },
                    }
                },
                handler: getUserHandler,
            },
            {
                method: 'DELETE',
                path: '/users/{userId}',
                options: {
                    validate: {
                        params: Joi.object({
                            userId: Joi.number().integer()
                        }),
                        failAction: (request, h, err) => {
                            console.error(err);
                            throw err
                        },
                    }
                },
                handler: deleteUserHandler
            },
            {
                method: 'PUT',
                path: '/users/{userId}',
                options: {
                    validate: {
                        params: Joi.object({
                            userId: Joi.number().integer()
                        }),
                        payload: updateUserValidator
                    }
                },
                handler: updateUserHandler,
            }
        ])
    }
}

export default usersPlugin

interface UserInput {
    firstName: string
    lastName: string
    email: string
    social: {
        facebook?: string
        twitter?: string
        github?: string
        website?: string
    }
}

export const createUserHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    const { prisma } = request.server.app
    const payload = request.payload as UserInput
    try {
        const createUser = await prisma.user.create({
            data: {
                firstName: payload.firstName,
                lastName: payload.lastName,
                email: payload.email,
                social: JSON.stringify(payload.social)
            },
            select: {
                id: true
            }
        })
        console.log({ createUser })
        return h.response(createUser).code(201)
    } catch (error) {
        console.log(error)
        return h.response(boom.badImplementation("Error creating user"))
    }
}

export const getUserHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    const { prisma } = request.server.app
    const userId = parseInt(request.params.userId, 10)
    try {
        const user = await prisma.user.findFirst({
            where: {
                id: userId
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                social: true
            }
        })
        console.log({ user })
        if (!user) {
            return h.response('User not found').code(404)
        } else {
            return h.response(user).code(200)
        }
    } catch (err) {
        console.log(err)
        return h.response('User not found').code(500)
    }
}

export const deleteUserHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    const { prisma } = request.server.app
    const userId = parseInt(request.params.userId, 10)
    try {
        const user = await prisma.user.delete({
            where: {
                id: userId
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                social: true
            }
        })
        return h.response('User deleted').code(204)
    } catch (err) {
        console.log(err)
        return h.response('User not found').code(500)
    }
}

export const updateUserHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    const { prisma } = request.server.app
    const userId = parseInt(request.params.userId, 10)
    const payload = request.payload as Partial<UserInput>
    try {
        const user = await prisma.user.update({
            data: payload,
            where: {
                id: userId
            }
        })
        console.log({ user })
        if (!user) {
            return h.response('User not found').code(404)
        } else {
            return h.response(user).code(200)
        }
    } catch (err) {
        console.log(err)
        return h.response('User not found').code(500)
    }
}