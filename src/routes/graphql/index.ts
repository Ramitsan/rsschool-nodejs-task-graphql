import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { createGqlResponseSchema, gqlResponseSchema } from './schemas.js';
import { GraphQLInterfaceType, GraphQLObjectType, GraphQLSchema, GraphQLString, graphql, buildSchema, GraphQLFloat, GraphQLInt, GraphQLList, GraphQLBoolean } from 'graphql';
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
      const UserType = new GraphQLObjectType({
        name: 'User',
        fields: {
          id: {type: GraphQLString},
          name: {type: GraphQLString}, 
          balance: {type: GraphQLFloat}
        }
      });

      const MemberType = new GraphQLObjectType({
        name: 'MemberType',
        fields: {
          id: {type: GraphQLString},
          discount: {type: GraphQLFloat},
          postsLimitPerMonth: {type: GraphQLInt},
        }
      });

      const PostType = new GraphQLObjectType({
        name: 'Post',
        fields: {
          id: {type: GraphQLString},
          title: {type: GraphQLString},
          content: {type: GraphQLString}
        }
      });

      const ProfileType = new GraphQLObjectType({
        name: 'Profile',
        fields: {
          id: {type: GraphQLString},
          isMale: {type: GraphQLBoolean},
          yearOfBirth: {type: GraphQLInt}
        }
      });

      const result = await graphql({
        source: req.body.query,
        // schema: buildSchema(`
        // type User {
        //   id: String
        //   name: String
        // }

        // type MemberType {
        //   id: String
        //   discount: Float
        //   postsLimitPerMonth: Int
        // }

        // type Query {
        //   users: [User]
        //   memberTypes: [MemberType]
        // }
        // `),

        schema: new GraphQLSchema({
          types: [UUIDType],
          query: new GraphQLObjectType({
            name: 'Query',
            fields: {
              users: {
                type: new GraphQLList(UserType)
              },
              memberTypes: {
                type: new GraphQLList(MemberType)
              },
              posts: {
                type: new GraphQLList(PostType)
              },
              profiles: {
                type: new GraphQLList(ProfileType)
              }
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
        }
    })
      // console.log(result);
      // console.log(req.body);
      return result;
    },
  });
};

export default plugin;
