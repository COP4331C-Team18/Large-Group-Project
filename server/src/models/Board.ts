import mongoose, { Document, Schema, Types } from "mongoose";

/**
 * Based on your screenshot: the "Board" is a container for binary Yjs state + metadata.
 * - No teamIds/permissions in this project per your requirement.
 * - createdAt/updatedAt are provided via { timestamps: true }.
 */

export interface BoardDocument extends Document {
	/** Convenience alias for MongoDB's _id (string). */
	boardId?: string;
	title: string;
	/** Optional description of the board. */
	description: string;
	/** The category of the board (e.g. "Work", "Education", "General"). */
	category: string;
	/** 6-character hex access code for joining the board (e.g. "3F2A1B"). */
	joinCode: string;
	/** Reference to the user who created it (even if everyone is effectively an owner). */
	owner: Types.ObjectId;
	/** The latest Yjs state/update blob for fast loading. */
	yjsUpdate: Buffer;
	/** Base64 or URL for dashboard preview image. */
	thumbnail?: string | null;
	/** Simple user-defined tags. */
	tags: string[];
}

const boardSchema = new Schema<BoardDocument>(
	{
		title: {
			type: String,
			required: true,
			trim: true,
			maxlength: 120,
		},
		description: {
			type: String,
			default: "",
			trim: true,
			maxlength: 500,
		},
		category: {
			type: String,
			default: "General",
			trim: true,
		},
		joinCode: {
			type: String,
			required: false,
			unique: false,
			index: true,
			sparse: true,
		},
		owner: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		yjsUpdate: {
			type: Buffer,
			required: false,
			default: () => Buffer.from([]),
		},
		thumbnail: {
			type: String,
			default: null,
			trim: true,
		},
		tags: {
			type: [String],
			default: [],
			validate: {
				validator: (arr: string[]) => Array.isArray(arr) && arr.every((t) => typeof t === "string"),
				message: "tags must be an array of strings",
			},
		},
	},
	{
		timestamps: true,
		toJSON: {
			virtuals: true,
			transform: (_doc, ret) => { delete ret.yjsUpdate; return ret; },
		},
		toObject: { virtuals: true },
	}
);

// Explicit board id field for clients. MongoDB already stores this as _id.
boardSchema.virtual("boardId").get(function (this: BoardDocument) {
	return this._id?.toString();
});

boardSchema.index({ updatedAt: -1 });

export default mongoose.model<BoardDocument>("Board", boardSchema);
