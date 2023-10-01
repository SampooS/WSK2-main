import {Response} from 'express';
import jwt from 'jsonwebtoken';
import {GraphQLError} from 'graphql';
import {Cat} from '../../interfaces/Cat';
import {locationInput} from '../../interfaces/Location';
import {User, UserIdWithToken} from '../../interfaces/User';
import rectangleBounds from '../../utils/rectangleBounds';
import catModel from '../models/catModel';
import userModel from '../models/userModel';
import mongoose, {Types} from 'mongoose';
import UploadMessageResponse from '../../interfaces/UploadMessageResponse';
import fetchData from '../../functions/fetchData';
import {postCat} from '../../../test/catFunctions';

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
    createCat: async (_: undefined, args: Cat, user: UserIdWithToken) => {
      
      if (!user.token) {
        console.log("no token");
        return null;
      }

      args.owner = new Types.ObjectId(user.id);
      
      const cat = (await catModel.create(args)) as Cat;
      
      console.log("cat created");
      console.log(cat);
      

      if (!cat) {
        throw new GraphQLError('Cat not created', {
          extensions: {code: 'NOT_CREATED'},
        });
      }
      
      return cat;
    },
    updateCat: async (_: undefined, args: Cat, user: UserIdWithToken) => {
      console.log("updating cat");
      
      const cat = (await catModel.findById(args.id)) as Cat;

      console.log("cat = " + cat);

      if (!cat) {
        throw new GraphQLError('Cat not found', {
          extensions: {code: 'NOT_FOUND'},
        });
      }

      console.log("cat found");

      console.log("userid: " + user.id + "\ncat owner: " + cat.owner.toString());
      
      
      if (user.id !== cat.owner.toString() && user.role !== 'admin') {
        throw new GraphQLError('Unauthorized!', {
          extensions: {code: 'UNAUTHORIZED'},
        });
      }

      

      console.log("authorized");
      
      const updatedCat = (await catModel.findByIdAndUpdate(args.id, args, {
        new: true,
      })) as Cat;
      console.log("updated cat = " + updatedCat);
      
      return updatedCat;
    },

    deleteCat: async (
      _: undefined,
      args: {id: string},
      user: UserIdWithToken
    ) => {
      console.log("deleting cat");
      
      const cat = (await catModel.findById(args.id)) as Cat;
      if (!cat) {
        throw new GraphQLError('Cat not found', {
          extensions: {code: 'NOT_FOUND'},
        });
      }
      if (user.id !== cat.owner.toString() && user.role !== 'admin') {
        throw new GraphQLError('Unauthorized', {
          extensions: {code: 'UNAUTHORIZED'},
        });
      }
      const deletedCat = (await catModel.findByIdAndDelete(args.id)) as Cat;
      return deletedCat;
    },
    updateCatAsAdmin: async (
      _parent: undefined,
      args: Cat,
      user: UserIdWithToken
    ) => {

      if (!args) {
        throw new GraphQLError('Cat not found', {
          extensions: {code: 'NOT_FOUND'},
        });
      }
      if (user.role !== 'admin' || !user.token) {
        throw new GraphQLError('This function is for admin use only', {
          extensions: {code: 'UNAUTHORIZED'},
        });
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

    deleteCatAsAdmin: async (_parent: undefined,
      args: Cat,
      user: UserIdWithToken
    ) => {
      const cat = (await catModel.findById(args.id)) as Cat;
      if (!cat) {
        throw new GraphQLError('Cat not found', {
          extensions: {code: 'NOT_FOUND'},
        });
      }
      if (user.role !== 'admin' || !user.token) {
        throw new GraphQLError('This function is for admin use only', {
          extensions: {code: 'UNAUTHORIZED'},
        });
      }

      const response = await catModel.findByIdAndDelete(args.id) as Cat;

      return response;
    },
  },
};
