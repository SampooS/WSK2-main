import { Response } from 'express';
import jwt from 'jsonwebtoken';
import {GraphQLError} from 'graphql';
import {Cat} from '../../interfaces/Cat';
import {locationInput} from '../../interfaces/Location';
import {User, UserIdWithToken} from '../../interfaces/User';
import rectangleBounds from '../../utils/rectangleBounds';
import catModel from '../models/catModel';
import userModel from '../models/userModel';
import {Types} from 'mongoose';
import UploadMessageResponse from '../../interfaces/UploadMessageResponse';
import fetchData from '../../functions/fetchData';
import { postCat } from '../../../test/catFunctions';

// TODO: create resolvers based on cat.graphql
// note: when updating or deleting a cat, you need to check if the user is the owner of the cat
// note2: when updating or deleting a cat as admin, you need to check if the user is an admin by checking the role from the user object

export default {
  Query: {
    cats: async () => {
      const response = await catModel.find().populate('owner');
      return response;
    },
    catById: async (_parent: undefined, args: {id: string}) => {
      const response = await catModel.findById(args.id).populate('owner');
      return response;
    },
    catsByArea: async (_parent: undefined, args: {area: string}) => {
        const response = await catModel.find({area: args.area}).populate('owner');
        return response;
    },
    catsByOwner: async (_parent: undefined, args: {owner: string}) => {
      const response = await catModel.find({owner: args.owner});
      return response;
    },
  },
  Mutation: {
    createCat: async (_parent: undefined, args: Cat) => {
      const token = jwt.verify(
        process.env.token as string,
        process.env.JWT_SECRET as string
      ) as UserIdWithToken;

      if (!token) {
        throw new GraphQLError('Please login to create a cat');
      }
      const user = await userModel.findById(token.id);

      if (!user) {
        throw new GraphQLError('owner invalid');
      }

      console.log('owner = ' + user);

      const newCat = new catModel(args);
      newCat.owner = user;

      return await newCat.save();
    },
    updateCat: async (
      _parent: undefined,
      args: {id: string; cat_name: string; weight: number; birthdate: Date}
    ) => {
      const userFromToken = jwt.verify(
        process.env.token as string,
        process.env.JWT_SECRET as string
      ) as UserIdWithToken;

      const oldCat = await catModel.findById(args.id);

      if (!oldCat) { throw new GraphQLError('Cat doesnt exist'); }
      
      if (!userFromToken || userFromToken.id != oldCat.owner.toString()) {
        throw new GraphQLError(
          'UserId doesnt match cat or doesnt exist, please login to the correct user'
        );
      }

      const response = await catModel.findByIdAndUpdate(
        args.id,
        {
          cat_name: args.cat_name,
          weight: args.weight,
          birth_date: args.birthdate,
        },
        {new: true}
      ).populate('owner');

      return response;
    },
    deleteCat: async (_parent: undefined, args: {id: string}) => {
      const userFromToken = jwt.verify(
        process.env.token as string,
        process.env.JWT_SECRET as string
      ) as UserIdWithToken;

      const cat = await catModel.findById(args.id);

      if (!cat) {
        throw new GraphQLError('Cat doesnt exist');
      }

      if (cat.owner.id != userFromToken.id) {
        throw new GraphQLError(`You don't own this cat`);
      }
    },
    updateCatAsAdmin: async (
      _parent: undefined,
      args: {id: string; cat_name: string; weight: number; birthdate: Date}
    ) => {
      const userFromToken = jwt.verify(
        process.env.token as string,
        process.env.JWT_SECRET as string
      ) as UserIdWithToken;

      if (!userFromToken || userFromToken.role !== 'admin') {
        throw new GraphQLError('This function is for admin use only');
      }

      const response = await catModel.findByIdAndUpdate(
        args.id,
        {
          cat_name: args.cat_name,
          weight: args.weight,
          birth_date: args.birthdate,
        },
        {new: true}
      );

      return response;
    },
    deleteCatAsAdmin: async (_parent: undefined, args: {id: string}) => {
      const userFromToken = jwt.verify(
        process.env.token as string,
        process.env.JWT_SECRET as string
      ) as UserIdWithToken;

      if (!userFromToken || userFromToken.role !== 'admin') {
        throw new GraphQLError('This function is for admin use only');
      }

      const response = await catModel.findByIdAndDelete(args.id);

      return response;
    },
  },
};
