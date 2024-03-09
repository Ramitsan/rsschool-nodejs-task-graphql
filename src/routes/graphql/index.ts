import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { createGqlResponseSchema, gqlResponseSchema } from './schemas.js';
import {
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  graphql,
  GraphQLFloat,
  GraphQLInt,
  GraphQLList,
  GraphQLBoolean,
  GraphQLEnumType
} from 'graphql';
import { UUIDType } from './types/uuid.js';

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.route({
    url: '/',
    method: 'POST',
    schema: {
      ...createGqlResponseSchema,
      response: {
        200: gqlResponseSchema,
      },
    },
    async handler(req) {

      const MemberType = new GraphQLObjectType({
        name: 'MemberType',
        fields: {
          id: { type: GraphQLString },
          discount: { type: GraphQLFloat },
          postsLimitPerMonth: { type: GraphQLInt },
        }
      });

      const ProfileType = new GraphQLObjectType({
        name: 'Profile',
        fields: {
          id: { type: GraphQLString },
          isMale: { type: GraphQLBoolean },
          yearOfBirth: { type: GraphQLInt },
          memberType: {
            type: MemberType, resolve: (parent) => {
              try {
                return fastify.prisma.memberType.findUnique({
                  where: {id: parent.memberTypeId },
                });
              } catch {
                return [];
              }
            }
          },
        }
      });

      const PostType = new GraphQLObjectType({
        name: 'Post',
        fields: {
          id: { type: GraphQLString },
          title: { type: GraphQLString },
          content: { type: GraphQLString }
        }
      });

      const UserType = new GraphQLObjectType({
        name: 'User',
        fields: () => ({
          id: { type: GraphQLString },
          name: { type: GraphQLString },
          balance: { type: GraphQLFloat },
          profile: {
            type: ProfileType,
            resolve: (parent) => {
              try {
                return fastify.prisma.profile.findUnique({
                  where: { userId: parent.id }
                });
              } catch {
                return null;
              }
            }
          },
          posts: {
            type: new GraphQLList(PostType),
            resolve: (parent) => {
              try {
                return fastify.prisma.post.findMany({
                  where: { authorId: parent.id }
                });
              } catch {
                return [];
              }
            }
          },
          userSubscribedTo: {
            type: new GraphQLList(UserType),
            resolve: ({ id }) => {
              return fastify.prisma.user.findMany({
                where: { subscribedToUser: { some: { subscriberId: id } } }
              });
            },
          },
          subscribedToUser: {
            type: new GraphQLList(UserType),
            resolve: ({ id }) => {
              return fastify.prisma.user.findMany({
                where: { userSubscribedTo: { some: { authorId: id } } }
              })
            },
          }
        })
      });

      const MemberTypeId = new GraphQLEnumType({
        name: 'MemberTypeId',
        values: {
          basic: { value: 'basic' },
          business: { value: 'business' },
        }
      });

      console.log('variables: ', req.body.variables);
      try {
        const result = await graphql({
          source: req.body.query,
          variableValues: req.body.variables,
          schema: new GraphQLSchema({
            types: [UUIDType],
            query: new GraphQLObjectType({
              name: 'Query',
              fields: {
                users: {
                  type: new GraphQLList(UserType),
                },
                memberTypes: {
                  type: new GraphQLList(MemberType),
                },
                posts: {
                  type: new GraphQLList(PostType),
                },
                profiles: {
                  type: new GraphQLList(ProfileType),
                },
                user: {
                  type: UserType,
                  args: {
                    id: { type: UUIDType }
                  },
                },
                memberType: {
                  type: MemberType,
                  args: {
                    id: { type: MemberTypeId }
                  }
                },
                post: {
                  type: PostType,
                  args: {
                    id: { type: UUIDType }
                  }
                },
                profile: {
                  type: ProfileType,
                  args: {
                    id: { type: UUIDType }
                  }
                },
              }
            })
          }),
          rootValue: {
            users: () => {
              return fastify.prisma.user.findMany();
            },
            memberTypes: () => {
              return fastify.prisma.memberType.findMany();
            },
            posts: () => {
              return fastify.prisma.post.findMany();
            },
            profiles: () => {
              return fastify.prisma.profile.findMany();
            },
            user: ({ id }) => {
              return fastify.prisma.user.findUnique({
                where: {
                  id: id,
                },
              });
            },
            memberType: ({ id }) => {
              return fastify.prisma.memberType.findUnique({
                where: {
                  id: id,
                },
              });
            },
            post: ({ id }) => {
              return fastify.prisma.post.findUnique({
                where: {
                  id: id,
                },
              });
            },
            profile: ({ id }) => {
              try {
                return fastify.prisma.profile.findUnique({
                  where: {
                    id: id,
                  },
                });
              }
              catch (err) {
                return null;
              }
            }
          }
        })
        return result;
      }
      catch (err) {
        console.log(err);
      }
    },
  });
};

export default plugin;
