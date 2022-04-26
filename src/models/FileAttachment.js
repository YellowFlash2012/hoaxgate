import sequelize from '../config/db';
import { Sequelize } from 'sequelize';

const Model = Sequelize.Model;

class FileAttachment extends Model {}

FileAttachment.init(
    {
        filename: {
            type: Sequelize.STRING,
        },
        uploadDate: {
            type: Sequelize.DATE,
        },
    },
    {
        Sequelize,
        modelName: 'fileAttachment',
        timestamps: false,
    }
);

export default FileAttachment;
