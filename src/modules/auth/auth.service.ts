import { prisma } from '../../config/database';
import { hashPassword, comparePassword } from '../../utils/bcrypt';
import { generateToken } from '../../utils/jwt';

export class AuthService {
    async login(email: string, password: string) {
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                subscriptionType: true,
            },
        });

        if (!user) {
            throw new Error('La contraseña o email son incorrectos');
        }

        if (!user.isActive) {
            throw new Error('La cuenta está inactiva');
        }

        const isPasswordValid = await comparePassword(password, user.passwordHash);

        if (!isPasswordValid) {
            throw new Error('La contraseña o email son incorrectos');
        }

        const token = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                onboardingCompleted: user.onboardingCompleted,
                subscriptionType: user.subscriptionType,
            },
        };
    }

    async createUser(data: {
        email: string;
        password: string;
        fullName: string;
        role?: 'ADMIN' | 'USER';
        subscriptionTypeId?: string;
    }) {
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existingUser) {
            throw new Error('Ya existe un usuario con este email');
        }

        const passwordHash = await hashPassword(data.password);

        const user = await prisma.user.create({
            data: {
                email: data.email,
                passwordHash,
                fullName: data.fullName,
                role: data.role || 'USER',
                subscriptionTypeId: data.subscriptionTypeId,
            },
            include: {
                subscriptionType: true,
            },
        });

        // Create default user settings
        await prisma.userSettings.create({
            data: {
                userId: user.id,
                language: 'ES',
            },
        });

        return {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            subscriptionType: user.subscriptionType,
        };
    }

    async forgotPassword(email: string) {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            // Don't reveal if user exists
            return { message: 'If the email exists, a reset link will be sent' };
        }

        // TODO: Generate reset token and send email
        // For now, just return success message
        return { message: 'If the email exists, a reset link will be sent' };
    }

    async resetPassword(_token: string, _newPassword: string) {
        // TODO: Implement token validation and password reset
        throw new Error('Not implemented yet');
    }
}
