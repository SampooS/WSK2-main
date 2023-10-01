import {GraphQLError} from 'graphql';
import {Cat} from '../../interfaces/Cat';
import LoginMessageResponse from '../../interfaces/LoginMessageResponse';
import {
  UserInput,
  Credentials,
  TokenMessage,
  UserModify,
} from '../../interfaces/User';
import fetchData from '../../functions/fetchData';
import AuthMessageResponse from '../../interfaces/AuthMessageResponse';
// TODO: create resolvers based on user.graphql
// note: when updating or deleting a user don't send id to the auth server, it will get it from the token
// note2: when updating or deleting a user as admin, you need to check if the user is an admin by checking the role from the user object

export default {
  Query: {
    users: async () => {
      const users = await fetchData<AuthMessageResponse>(
        `${process.env.AUTH_API_URL}/users`
      );
      console.log(users);
      return users;
    },
    userById: async (_parent: undefined, args: {id: string}) => {

      const options: RequestInit = {
        method: 'GET',
        headers: {'Content-Type': 'application/json'},
      };

      const response = await fetchData(
        `${process.env.AUTH_API_URL}/users/${args.id}`, options
      );
      console.log(response);

      return response;
    },
    checkToken: async () => {
      const response = await fetchData(
        process.env.AUTH_API_URL + '/users/check',
        {
          method: 'GET',
          headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.token}`},
        }
      );
      return response;
    },
  },
  Mutation: {
    register: async (_parent: undefined, args: {user: UserInput}) => {

      console.log(args.user);
            
      const response = await fetchData<AuthMessageResponse>(
        process.env.AUTH_API_URL + '/users',
        {
          method: 'POST',
          body: JSON.stringify(args.user),
          headers: {'Content-Type': 'application/json'},
        }
      );
      return response;
    },
    login: async (_parent: undefined, args: {credentials: Credentials}) => {

      console.log(args);

      const user = await fetchData<LoginMessageResponse>(
        process.env.AUTH_API_URL + '/auth/login',
        {
          method: 'POST',
          body: JSON.stringify(args.credentials),
          headers: {'Content-Type': 'application/json'},
        }
      );
      process.env.token = user.token;
      console.log(process.env.token);
      
      return user;
    },
    updateUser: async (_parent: undefined, args: {user: UserModify}) => {
      if (process.env.token === undefined || process.env.token === '') {
        throw new GraphQLError('token not defined');
      }

      const response = await fetchData<TokenMessage>(
        process.env.AUTH_API_URL + '/users',
        {
          method: 'PUT',
          body: JSON.stringify(args.user),
          headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.token}`},
        }
      );
      return response;
    },
    deleteUser: async (_parent: undefined, args: {id: string}) => {
      const response = await fetchData<TokenMessage>(
        process.env.AUTH_API_URL + '/users',
        {
          method: 'DELETE',
          headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.token}`},
        }
      );
      return response;
    },
    updateUserAsAdmin: async (_parent: undefined, args: {user: UserModify, id: string}) => {
      const response = await fetchData<TokenMessage>(
        process.env.AUTH_API_URL + '/users/' + args.id,
        {
          method: 'PUT',
          body: JSON.stringify(args.user),
          headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.token}`},
        }
      );
      return response;
    },
    deleteUserAsAdmin: async (_parent: undefined, args: {user: UserModify, id: string}) => {
      const response = await fetchData<TokenMessage>(
        process.env.AUTH_API_URL + '/users/' + args.id,
        {
          method: 'DELETE',
          body: JSON.stringify(args.user),
          headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.token}`},
        }
      );
      return response;
    },

  },
};
