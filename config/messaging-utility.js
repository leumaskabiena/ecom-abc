import nodemailer from 'nodemailer';
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';

class MessagingUtility {
    constructor(gmailUser, gmailPass) {
        this.emailTransporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: gmailUser,
                pass: gmailPass
            }
        });

        this.whatsappReady = false;
        this.initializeWhatsApp();
    }

    initializeWhatsApp() {
        this.whatsappClient = new Client({
            authStrategy: new LocalAuth(),
            puppeteer: {
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
                headless: true
            }
        });

        this.whatsappClient.on('qr', (qr) => {
            console.log('Please scan this QR code to connect WhatsApp:');
            qrcode.generate(qr, { small: true });
        });

        this.whatsappClient.on('ready', () => {
            console.log('WhatsApp client is ready!');
            this.whatsappReady = true;
        });

        this.whatsappClient.on('disconnected', () => {
            console.log('WhatsApp client disconnected');
            this.whatsappReady = false;
            // Attempt to reconnect
            setTimeout(() => {
                this.initializeWhatsApp();
            }, 5000);
        });

        this.whatsappClient.on('auth_failure', () => {
            console.log('WhatsApp authentication failed');
            this.whatsappReady = false;
        });

        try {
            this.whatsappClient.initialize();
        } catch (error) {
            console.error('Error initializing WhatsApp client:', error);
        }
    }

    formatPhoneNumber(phoneNumber) {
        let cleaned = phoneNumber.replace(/\D/g, '');
        
        if (cleaned.startsWith('0')) {
            cleaned = '27' + cleaned.substring(1);
        }
        
        if (cleaned.length < 11 && !cleaned.startsWith('27')) {
            cleaned = '27' + cleaned;
        }
        
        return cleaned;
    }

    async sendEmail(to, subject, body) {
        try {
            const mailOptions = {
                from: this.emailTransporter.options.auth.user,
                to,
                subject,
                text: body
            };

            const info = await this.emailTransporter.sendMail(mailOptions);
            console.log('Email sent successfully:', info.messageId);
            return {
                success: true,
                messageId: info.messageId
            };
        } catch (error) {
            console.error('Error sending email:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async sendWhatsAppMessage(phoneNumber, message) {
        if (!this.whatsappReady) {
            console.log('WhatsApp client not ready. Message queued.');
            return {
                success: false,
                error: 'WhatsApp client not ready',
                queued: true
            };
        }

        try {
            const formattedNumber = this.formatPhoneNumber(phoneNumber);
            console.log('Sending WhatsApp message to:', formattedNumber);

            // Check if the number exists on WhatsApp
            const numberDetails = await this.whatsappClient.getNumberId(formattedNumber);
            if (!numberDetails) {
                throw new Error('The provided number is not registered on WhatsApp');
            }

            const chatId = `${formattedNumber}@c.us`;
            await this.whatsappClient.sendMessage(chatId, message);
            
            return {
                success: true,
                formattedNumber
            };
        } catch (error) {
            console.error('Error sending WhatsApp message:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Method to check if WhatsApp is ready
    isWhatsAppReady() {
        return this.whatsappReady;
    }
}

export default MessagingUtility;