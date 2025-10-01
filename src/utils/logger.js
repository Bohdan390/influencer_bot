const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.logDir = path.join(process.cwd(), 'logs');
        this.ensureLogDirectory();
        this.startDate = new Date().toISOString().split('T')[0];
    }

    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    getLogFilePath(type = 'general') {
        return path.join(this.logDir, `${type}_${this.startDate}.log`);
    }

    formatMessage(level, message, data = null) {
        const timestamp = new Date().toISOString();
        let logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
        
        if (data) {
            logEntry += `\nData: ${JSON.stringify(data, null, 2)}`;
        }
        
        return logEntry + '\n';
    }

    writeToFile(filePath, message) {
        try {
            fs.appendFileSync(filePath, message);
        } catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }

    info(message, data = null) {
        const formatted = this.formatMessage('INFO', message, data);
        console.log(`ℹ️  ${message}`, data || '');
        this.writeToFile(this.getLogFilePath('general'), formatted);
    }

    error(message, error = null) {
        const errorData = error ? {
            message: error.message,
            stack: error.stack,
            code: error.code
        } : null;
        
        const formatted = this.formatMessage('ERROR', message, errorData);
        console.error(`❌ ${message}`, error || '');
        this.writeToFile(this.getLogFilePath('errors'), formatted);
        this.writeToFile(this.getLogFilePath('general'), formatted);
    }

    warn(message, data = null) {
        const formatted = this.formatMessage('WARN', message, data);
        console.warn(`⚠️  ${message}`, data || '');
        this.writeToFile(this.getLogFilePath('general'), formatted);
    }

    success(message, data = null) {
        const formatted = this.formatMessage('SUCCESS', message, data);
        console.log(`✅ ${message}`, data || '');
        this.writeToFile(this.getLogFilePath('general'), formatted);
    }

    debug(message, data = null) {
        if (process.env.NODE_ENV === 'development') {
            const formatted = this.formatMessage('DEBUG', message, data);
            console.log(`🔍 ${message}`, data || '');
            this.writeToFile(this.getLogFilePath('debug'), formatted);
        }
    }

    // Specific logging methods for different components
    
    firebase(message, data = null) {
        const formatted = this.formatMessage('FIREBASE', message, data);
        console.log(`🔥 ${message}`, data || '');
        this.writeToFile(this.getLogFilePath('firebase'), formatted);
    }

    campaign(message, data = null) {
        const formatted = this.formatMessage('CAMPAIGN', message, data);
        console.log(`🚀 ${message}`, data || '');
        this.writeToFile(this.getLogFilePath('campaigns'), formatted);
    }

    api(method, url, status, duration, data = null) {
        const message = `${method} ${url} - ${status} (${duration}ms)`;
        const formatted = this.formatMessage('API', message, data);
        console.log(`🌐 ${message}`);
        this.writeToFile(this.getLogFilePath('api'), formatted);
    }

    email(message, data = null) {
        const formatted = this.formatMessage('EMAIL', message, data);
        console.log(`📧 ${message}`, data || '');
        this.writeToFile(this.getLogFilePath('email'), formatted);
    }

    ai(message, data = null) {
        const formatted = this.formatMessage('AI', message, data);
        console.log(`🤖 ${message}`, data || '');
        this.writeToFile(this.getLogFilePath('ai'), formatted);
    }

    database(message, data = null) {
        const formatted = this.formatMessage('DATABASE', message, data);
        console.log(`🗄️  ${message}`, data || '');
        this.writeToFile(this.getLogFilePath('database'), formatted);
    }

    // Clean old log files (keep last 7 days)
    cleanOldLogs() {
        try {
            const files = fs.readdirSync(this.logDir);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - 7);

            files.forEach(file => {
                const filePath = path.join(this.logDir, file);
                const stats = fs.statSync(filePath);
                
                if (stats.mtime < cutoffDate) {
                    fs.unlinkSync(filePath);
                    this.info(`Cleaned old log file: ${file}`);
                }
            });
        } catch (error) {
            this.error('Failed to clean old logs', error);
        }
    }

    // Get log summary for dashboard
    getLogSummary() {
        try {
            const errorLogPath = this.getLogFilePath('errors');
            const generalLogPath = this.getLogFilePath('general');
            
            let errorCount = 0;
            let totalLogs = 0;
            
            if (fs.existsSync(errorLogPath)) {
                const errorContent = fs.readFileSync(errorLogPath, 'utf8');
                errorCount = (errorContent.match(/\[ERROR\]/g) || []).length;
            }
            
            if (fs.existsSync(generalLogPath)) {
                const generalContent = fs.readFileSync(generalLogPath, 'utf8');
                totalLogs = (generalContent.match(/\[\d{4}-\d{2}-\d{2}T/g) || []).length;
            }
            
            return {
                totalLogs,
                errorCount,
                logDirectory: this.logDir,
                logFiles: fs.readdirSync(this.logDir).filter(f => f.endsWith('.log'))
            };
        } catch (error) {
            this.error('Failed to get log summary', error);
            return { totalLogs: 0, errorCount: 0, logDirectory: this.logDir };
        }
    }
}

// Create singleton instance
const logger = new Logger();

// Clean old logs on startup
logger.cleanOldLogs();

module.exports = logger; 