import {Document} from 'mongoose';
interface User extends Document {
  user_name: string;
  email: string;
  password: string;
}

interface UserTest {
  id?: string;
  user_name?: string; // returned from graphql is snake_case
  userName?: string; // graphql variables are camelCase
  email?: string;
  password?: string;
  token?: string;
}

interface UserLogin {
  user_name: string;
  email: string;
  id: string;
}

interface UserIdWithToken {
  id: string;
  token: string;
  role: 'admin' | 'user';
}

interface TokenMessage {
  token: string;
  message: string;
  user: User;
}

interface UserInput {
  user_name: string;
  email: string;
  password: string;
}

interface UserModify {
  user_name?: string;
  email?: string;
  password?: string;
}

interface Credentials {
  username: string;
  password: string;
}

export {User, UserTest, UserIdWithToken, UserInput, Credentials, TokenMessage, UserModify, UserLogin};
