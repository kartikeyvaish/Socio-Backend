// Packages Imports
import cors from "cors";
import compression from "compression";
import express from "express";
import helmet from "helmet";
import morgan from "morgan"

// exporting a function that applies necessary middleware to the express app
export default function (app: express.Application) {
    if (process.env.NODE_ENV === "development") app.use(morgan("dev"));
    app.use(helmet());
    app.use(compression());
    app.use(express.json({ limit: "10mb" }));
    app.use(cors());
    app.use(express.urlencoded({ extended: true }));
};
