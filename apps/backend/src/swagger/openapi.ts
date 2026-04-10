import { z } from 'zod';
import {
  ApiErrorSchema,
  AuthResponseSchema,
  RegisterPayloadSchema,
  LoginPayloadSchema,
  RefreshTokenPayloadSchema,
  RefreshTokenResponseSchema,
  ForgotPasswordPayloadSchema,
  ResetPasswordPayloadSchema,
  ResetPasswordResponseSchema,
  GoogleOAuthPayloadSchema,
  GitHubOAuthPayloadSchema,
  UserPreferencesSchema,
  UserSchema,
  UpdateProfilePayloadSchema,
  UpdatePasswordPayloadSchema,
  UpdatePreferencesPayloadSchema,
  DeactivateAccountPayloadSchema,
  BoardSchema,
  GetBoardsResponseSchema,
  TemplateSchema,
  GetTemplatesResponseSchema,
  RedeemInvitePayloadSchema,
  RedeemInviteResponseSchema,
} from '@sefirah/shared';

const zodToOpenApiSchema = (schema: z.ZodTypeAny) => {
  const jsonSchema = z.toJSONSchema(schema) as Record<string, unknown>;
  const { $schema, ...openApiCompatibleSchema } = jsonSchema;
  return openApiCompatibleSchema;
};

const generatedSchemas = {
  ErrorResponse: zodToOpenApiSchema(ApiErrorSchema),
  AuthResponse: zodToOpenApiSchema(AuthResponseSchema),
  UserPreferences: zodToOpenApiSchema(UserPreferencesSchema),
  User: zodToOpenApiSchema(UserSchema),
  MessageResponse: zodToOpenApiSchema(ResetPasswordResponseSchema),
  RegisterPayload: zodToOpenApiSchema(RegisterPayloadSchema),
  LoginPayload: zodToOpenApiSchema(LoginPayloadSchema),
  RefreshTokenPayload: zodToOpenApiSchema(RefreshTokenPayloadSchema),
  RefreshTokenResponse: zodToOpenApiSchema(RefreshTokenResponseSchema),
  ForgotPasswordPayload: zodToOpenApiSchema(ForgotPasswordPayloadSchema),
  ResetPasswordPayload: zodToOpenApiSchema(ResetPasswordPayloadSchema),
  GoogleOAuthPayload: zodToOpenApiSchema(GoogleOAuthPayloadSchema),
  GitHubOAuthPayload: zodToOpenApiSchema(GitHubOAuthPayloadSchema),
  UpdateProfilePayload: zodToOpenApiSchema(UpdateProfilePayloadSchema),
  UpdatePasswordPayload: zodToOpenApiSchema(UpdatePasswordPayloadSchema),
  UpdatePreferencesPayload: zodToOpenApiSchema(UpdatePreferencesPayloadSchema),
  DeactivateAccountPayload: zodToOpenApiSchema(DeactivateAccountPayloadSchema),
  Board: zodToOpenApiSchema(BoardSchema),
  PaginatedBoardResponse: zodToOpenApiSchema(GetBoardsResponseSchema),
  Template: zodToOpenApiSchema(TemplateSchema),
  PaginatedTemplateResponse: zodToOpenApiSchema(GetTemplatesResponseSchema),
  RedeemInvitePayload: zodToOpenApiSchema(RedeemInvitePayloadSchema),
  RedeemInviteResponse: zodToOpenApiSchema(RedeemInviteResponseSchema),
} as const;

export const openApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'Sefirah Board API',
    version: '1.0.0',
    description:
      'Backend API for Sefirah Board. Protected endpoints require Authorization: Bearer <accessToken>.',
  },
  servers: [
    {
      url: '/',
      description: 'Current host',
    },
  ],
  tags: [
    { name: 'Health' },
    { name: 'Auth' },
    { name: 'Users' },
    { name: 'Boards' },
    { name: 'Templates' },
    { name: 'Invites' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: generatedSchemas,
  },
  paths: {
    '/api/v1/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: {
          '200': {
            description: 'Service is healthy',
          },
        },
      },
    },
    '/api/v1/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterPayload' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Registered',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' },
              },
            },
          },
          '400': {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/v1/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login with email and password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginPayload' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Logged in',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
        },
      },
    },
    '/api/v1/auth/oauth/google': {
      post: {
        tags: ['Auth'],
        summary: 'Login/register via Google OAuth',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/GoogleOAuthPayload' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Authenticated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
        },
      },
    },
    '/api/v1/auth/oauth/github': {
      post: {
        tags: ['Auth'],
        summary: 'Login/register via GitHub OAuth',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/GitHubOAuthPayload' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Authenticated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
        },
      },
    },
    '/api/v1/auth/refresh-token': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh access token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RefreshTokenPayload' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Token refreshed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RefreshTokenResponse' },
              },
            },
          },
        },
      },
    },
    '/api/v1/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Request a password reset',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ForgotPasswordPayload' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Request accepted',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' },
              },
            },
          },
        },
      },
    },
    '/api/v1/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Complete password reset',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ResetPasswordPayload' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Password updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' },
              },
            },
          },
        },
      },
    },
    '/api/v1/users/me': {
      get: {
        tags: ['Users'],
        summary: 'Get current user profile',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Current user',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Users'],
        summary: 'Deactivate/delete current account',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/DeactivateAccountPayload' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Account deleted',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' },
              },
            },
          },
        },
      },
    },
    '/api/v1/users/me/profile': {
      patch: {
        tags: ['Users'],
        summary: 'Update profile',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateProfilePayload' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Updated user',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
        },
      },
    },
    '/api/v1/users/me/password': {
      put: {
        tags: ['Users'],
        summary: 'Update password',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdatePasswordPayload' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Password updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' },
              },
            },
          },
        },
      },
    },
    '/api/v1/users/me/preferences': {
      patch: {
        tags: ['Users'],
        summary: 'Update user preferences',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdatePreferencesPayload' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Updated user',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
        },
      },
    },
    '/api/v1/boards': {
      get: {
        tags: ['Boards'],
        summary: 'List boards',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Paginated boards',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PaginatedBoardResponse' },
              },
            },
          },
        },
      },
      post: {
        tags: ['Boards'],
        summary: 'Create board',
        security: [{ bearerAuth: [] }],
        responses: {
          '201': {
            description: 'Board created',
          },
        },
      },
    },
    '/api/v1/boards/{boardId}': {
      get: {
        tags: ['Boards'],
        summary: 'Get board by id',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'boardId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Board metadata',
          },
        },
      },
      patch: {
        tags: ['Boards'],
        summary: 'Update board metadata',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'boardId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Board updated',
          },
        },
      },
      delete: {
        tags: ['Boards'],
        summary: 'Delete board',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'boardId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '204': {
            description: 'Deleted',
          },
        },
      },
    },
    '/api/v1/templates': {
      get: {
        tags: ['Templates'],
        summary: 'List templates',
        responses: {
          '200': {
            description: 'Paginated templates',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PaginatedTemplateResponse' },
              },
            },
          },
        },
      },
    },
    '/api/v1/templates/{templateId}': {
      get: {
        tags: ['Templates'],
        summary: 'Get template by id',
        parameters: [
          {
            name: 'templateId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Template details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Template' },
              },
            },
          },
        },
      },
    },
    '/api/v1/invites/redeem': {
      post: {
        tags: ['Invites'],
        summary: 'Redeem invite code',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RedeemInvitePayload' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Invite redeemed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RedeemInviteResponse' },
              },
            },
          },
        },
      },
    },
  },
} as const;