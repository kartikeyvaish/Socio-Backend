import mongoose from "mongoose";
import { PostFileProps } from "./GeneralTypes";

// interface for CommentsSchema
export interface CommentsSchemaInterface {
    comment: string;
    commented_by: mongoose.Schema.Types.ObjectId;
    comment_datetime: Date;
    post_id: mongoose.Schema.Types.ObjectId;
}

// interface for ChatsSchema
export interface ChatsSchemaInterface {
    members: Array<mongoose.Schema.Types.ObjectId>;
    active_participants: Array<mongoose.Schema.Types.ObjectId>;
    last_message: MessagesSchemaInterface;
    updated_at: Date;
    created_at: Date;
}

// interface for FollowersSchema
export interface FollowersSchemaInterface {
    people: Array<mongoose.Schema.Types.ObjectId>;
    follower_of: mongoose.Schema.Types.ObjectId;
}

// interface for FollowingSchema
export interface FollowingSchemaInterface {
    people: Array<mongoose.Schema.Types.ObjectId>;
    following_of: mongoose.Schema.Types.ObjectId;
}

// interface for FollowRequestsSchema
export interface FollowRequestsSchemaInterface {
    request_to: mongoose.Schema.Types.ObjectId;
    request_from: mongoose.Schema.Types.ObjectId;
    request_datetime: Date;
}

// interface for Likes schema
export interface LikesSchemaInterface {
    post_id: mongoose.Schema.Types.ObjectId;
    liked_by: mongoose.Schema.Types.ObjectId;
    like_datetime: Date;
}

// Messages Schema
export interface MessagesSchemaInterface {
    message: string;
    chat_id: mongoose.Schema.Types.ObjectId;
    sender_id: mongoose.Schema.Types.ObjectId;
    message_type: "text" | "image" | "video" | "audio";
    message_datetime: Date;
    read: boolean;
    message_file: {
        _id?: string;
        uri?: string;
        mimeType?: string;
        width?: number;
        height?: number;
        public_id?: string;
        duration?: number;
    };
    thumbnail_image: {
        _id?: string;
        uri?: string;
        mimeType?: string;
        width?: number;
        height?: number;
        public_id?: string;
    };
    deleted_for: Array<mongoose.Schema.Types.ObjectId>;
}

// interface for OTPSchema
export interface OTPSchemaInterface {
    otp: string;
    verification_type: string;
    created_at: Date;
}

// interface for PostsSchema
export interface PostSchemaInterface {
    caption: string;
    post_owner_id: mongoose.Schema.Types.ObjectId;
    file: PostFileProps;
    thumbnail_image: PostFileProps;
    location: string;
    post_datetime: Date;
    likes_count: number;
    comments_count: number;
}

// interface for ResetRequestsSchema
export interface ResetRequestSchemaInterface {
    created_at: Date;
}

// interface for StoriesSchema
export interface StoriesSchemaInterface {
    story_owner_id: mongoose.Schema.Types.ObjectId;
    file: PostFileProps;
    viewed_by: Array<mongoose.Schema.Types.ObjectId>;
}

// interface for UsersSchema
export interface UserSchemaInterface {
    name: string;
    email: string;
    phone: string;
    username: string;
    profile_picture: string;
    push_notification_token: string;
    allow_push_notification: boolean;
    password: string;
    bio: string;
    account_verified: boolean;
    private_profile: boolean;
    two_factor_enabled: boolean;
    account_created_at: Date;
    last_updated_at: Date;
}