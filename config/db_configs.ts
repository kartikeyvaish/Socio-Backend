export default {
    Port: process.env.PORT || 3000,
    db_url: process.env.atlas_url || "",
    db_config: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    },
};

