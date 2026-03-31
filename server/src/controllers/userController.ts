import { Request, Response } from 'express';
import User from "../models/User.js";

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await User.find().select("-password");
        res.status(200).json(users);

    } catch (error) {
        res.status(500).json({ message: "Error fetching users" });
    }
};

export const getUserById = async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.params.id).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

    res.status(200).json(user);

    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({ message: "Invalid user ID" });
            }
        res.status(500).json({ message: "Error fetching user" });
    }
};

//Can update only the username
export const updateUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { username } = req.body;

        if (!username) {
            return res.status(400).json({ message: "Username is required" });
        }

        //Cannot change username to existing username
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(409).json({ message: "Username already taken" });
        }

        const updatedUser = await User.findByIdAndUpdate(
        id,
        { username },
        { new: true }
        ).select("-password");

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(updatedUser);

    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({ message: "Invalid user ID" });
            }
        res.status(500).json({ message: "Error updating user" });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);

        if (!deletedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "User deleted" });

    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({ message: "Invalid user ID" });
            }
        res.status(500).json({ message: "Error deleting user" });
    }
};
