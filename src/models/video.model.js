import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";


const videoSchema = new Schema(
    {
        videoFile: {
            type: String, // cloudinary url
            required: true
        },
        thumbnail: {
            type: String, //cloudinary url
            required: true
        },
        title: {
            type: String, 
            required: true
        },
        discription: {
            type: String, 
            required: true
        },
        duration: {
            type: Number, //cloudinary url
            required: true
        },
        views: {
            type: Number,
            default: 0
        },
        isPublished: {
            type: Boolean,
            default: ture
        },
        owner: {

        }
    }, 
    {
        timestamps: true
    }
)


videoSchema.plugin(mongooseAggregatePaginate)


export const Video = mongoose.model("Video", videoSchema)

