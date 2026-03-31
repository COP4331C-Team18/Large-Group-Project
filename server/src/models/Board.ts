import mongoose, { Document, Schema, Types } from "mongoose";

/**
 * Based on your screenshot: the "Board" is a container for binary Yjs state + metadata.
 * - No teamIds/permissions in this project per your requirement.
 * - createdAt/updatedAt are provided via { timestamps: true }.
 */

export interface BoardRevision {
	/** A full Yjs document state (snapshot) OR an aggregated update you can apply to a fresh doc. */
	yjsUpdate: Buffer;
	/** User that authored the change that produced this revision (stroke). */
	userId: Types.ObjectId;
	/** When this revision was saved. */
	savedAt: Date;
}

export interface BoardDocument extends Document {
	/** Convenience alias for MongoDB's _id (string). */
	boardId?: string;
	title: string;
	/** Reference to the user who created it (even if everyone is effectively an owner). */
	ownerId: Types.ObjectId;
	/** The latest Yjs state/update blob for fast loading. */
	yjsUpdate: Buffer;
	/** Base64 or URL for dashboard preview image. */
	thumbnail?: string | null;
	/** Simple user-defined tags. */
	tags: string[];
	/** Simple revision history as stored snapshots/aggregated updates. */
	revisions: BoardRevision[];
}

const boardRevisionSchema = new Schema<BoardRevision>(
	{
		yjsUpdate: { type: Buffer, required: true },
		userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
		savedAt: { type: Date, default: Date.now },
	},
	{ _id: false }
);

const boardSchema = new Schema<BoardDocument>(
	{
		title: {
			type: String,
			required: true,
			trim: true,
			maxlength: 120,
		},
		ownerId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		yjsUpdate: {
			type: Buffer,
			required: true,
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
		revisions: {
			type: [boardRevisionSchema],
			default: [],
			validate: {
				validator: (arr: BoardRevision[]) => Array.isArray(arr) && arr.length <= 100,
				message: "revisions exceeds max length of 100",
			},
		},
	},
	{ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Explicit board id field for clients. MongoDB already stores this as _id.
boardSchema.virtual("boardId").get(function (this: BoardDocument) {
	return this._id?.toString();
});

// Hard cap revision history to last 100 entries.
boardSchema.pre("save", function () {
	if (Array.isArray(this.revisions) && this.revisions.length > 100) {
		this.revisions = this.revisions.slice(-100);
	}
});

boardSchema.index({ updatedAt: -1 });

export default mongoose.model<BoardDocument>("Board", boardSchema);
