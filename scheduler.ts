import cron from 'node-cron';
import { Pinecone } from '@pinecone-database/pinecone';
import { createPgConnection, createEmbedding } from './utils';
import type { Project } from "./types";
require('dotenv').config();

let isPineconeIndexCreated: boolean = false;

async function scheduleIndexingRecords() {
    // Schedule the indexing task every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
        console.log("Indexing records started");

        const client = await createPgConnection();

        try {
            const records = await client.query("SELECT COUNT(*) AS total_records FROM public.projects");
            const checkpoint = await client.query("SELECT id from public.checkpoint where name = 'last_indexed_record'");
            const lastIndexedRecord = checkpoint.rows[0].id;
            const totalRecords = records.rows[0].total_records;

            if (totalRecords > lastIndexedRecord) {
                const pinecone = new Pinecone();
                const indexName = process.env.PINECONE_INDEX || '';

                if (!isPineconeIndexCreated) {
                    await pinecone.createIndex({ name: indexName, dimension: 384, metric: 'cosine', waitUntilReady: true });
                    isPineconeIndexCreated = true;
                }

                const projects = await client.query("SELECT * FROM public.projects WHERE id > " + lastIndexedRecord);
                const index = pinecone.index<Project>(indexName);

                for (const project of projects.rows) {
                    const formattedProject = `title: ${project.title}\ntech: ${project.tech}\nfrontend: ${project.frontend}\nbackend: ${project.backend}\ndb: ${project.db}\ninfra: ${project.infra}\n\n`;
                    const embedding = await createEmbedding(formattedProject);
                    await index.upsert([{
                        id: project.id + '',
                        values: embedding as Array<number>,
                        metadata: {
                            title: project.title + '',
                            tech: project.tech + '',
                            frontend: project.frontend + '',
                            backend: project.backend + '',
                            db: project.db + '',
                            infra: project.infra + ''
                        }
                    }])
                }
                await client.query(`UPDATE public.checkpoint SET id = ${totalRecords} WHERE name = 'last_indexed_record'`);
            }

            console.log('Indexing records completed');
        } catch (error) {
            console.error('Error in indexing:', error);
        } finally {
            client.release();
        }
    });
}

export { scheduleIndexingRecords };