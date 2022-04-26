import express from 'express';
import { check, validationResult } from 'express-validator';
import validationException from '../error/validationException.js';
import { saveAttachment } from '../file/FileService.js';
import pagination from '../middlewares/pagination.js';
import AuthException from './AuthException.js';
import { getHoaxes, save } from './HoaxService.js';
import multer from 'multer';

const router = express.Router();

const upload = multer();

router.post(
    '/',
    check('content')
        .isLength({ min: 10, max: 5000 })
        .withMessage('Hoax content must be at least 10 characters long'),
    async (req, res, next) => {
        if (!req.authenticatedUser) {
            return next(new AuthException('Unauthorized content submission'));
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(new validationException(errors.array()));
        }

        await save(req.body, req.authenticatedUser);
        return res.send();
    }
);

router.get('/', pagination, async (req, res) => {
    const { page, size } = req.pagination;

    const hoaxes = await getHoaxes(page, size);
    res.send(hoaxes);
});

// file upload router
router.post(
    '/api/1.0/hoaxes/attachments',
    upload.single('file'),
    async (req, res) => {
        await saveAttachment(req.file);
        res.send();
    }
);

export default router;
