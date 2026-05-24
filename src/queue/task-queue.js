const Queue = require('bull');
const config = require('../../config/index');
const logger = require('../../config/logger');

class TaskQueue {
  constructor() {
    this.queues = {};
    this.redisConfig = {
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password || undefined,
      db: config.redis.db,
    };
  }

  getQueue(name) {
    if (!this.queues[name]) {
      this.queues[name] = new Queue(name, {
        redis: this.redisConfig,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      });

      this.queues[name].on('completed', (job) => {
        logger.info(`Job ${job.id} completed successfully`);
      });

      this.queues[name].on('failed', (job, err) => {
        logger.error(`Job ${job.id} failed:`, err);
      });

      this.queues[name].on('error', (error) => {
        logger.error(`Queue ${name} error:`, error);
      });
    }
    return this.queues[name];
  }

  async addTask(queueName, data, options = {}) {
    const queue = this.getQueue(queueName);
    const job = await queue.add(data, options);
    logger.info(`Task added to queue ${queueName}: ${job.id}`);
    return job;
  }

  async processQueue(queueName, handler, concurrency = 1) {
    const queue = this.getQueue(queueName);
    queue.process(concurrency, async (job) => {
      logger.info(`Processing job ${job.id} from queue ${queueName}`);
      return handler(job.data, job);
    });
  }

  async getJobState(queueName, jobId) {
    const queue = this.getQueue(queueName);
    const job = await queue.getJob(jobId);
    if (!job) return null;
    return job.getState();
  }

  async closeAll() {
    const closePromises = Object.values(this.queues).map((queue) =>
      queue.close()
    );
    await Promise.all(closePromises);
    this.queues = {};
  }
}

const taskQueue = new TaskQueue();

module.exports = taskQueue;
