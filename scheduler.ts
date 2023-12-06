import cron from 'node-cron';
import { Pinecone } from '@pinecone-database/pinecone';
import { createPgConnection, createEmbedding } from './utils';
import type { Project } from "./types";
require('dotenv').config();

const pinecone = new Pinecone({
    apiKey: process.env.PC_API_KEY || '',
    environment: process.env.PC_ENV || '',
});

async function scheduleIndexingRecords() {
    // Schedule the indexing task every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
        console.log("Indexing records started");

        const client = await createPgConnection();

        try {
            const [records]: any = await client.query("SELECT COUNT(*) AS total_records FROM public.projects");
            const checkpoint = await client.query("SELECT id from public.checkpoint where name = 'last_indexed_record'");
            const lastIndexedRecord = checkpoint[0].id;
            const totalRecords = records[0].total_records;

            if (totalRecords > lastIndexedRecord) {
                const indexList = await pinecone.listIndexes();
                const indexName = process.env.PC_INDEX || '';

                if (indexList.indexOf({ name: indexName }) === -1) {
                    await pinecone.createIndex({ name: indexName, dimension: 384, waitUntilReady: true })
                }

                const projects: any = await client.query("SELECT * FROM public.projects WHERE id > " + lastIndexedRecord);
                const index = pinecone.index<Project>(indexName);

                for (const project of projects) {
                    const { projectTitle, projectTech, projectFrontend, projectBackend, projectDb, projectInfra, projectId } = project;
                    const formattedProject = `title: ${projectTitle}\ntech: ${projectTech}\nfrontend: ${projectFrontend}\nbackend: ${projectBackend}\ndb: ${projectDb}\ninfra: ${projectInfra}\n\n`;
                    const embedding = await createEmbedding(formattedProject);
                    await index.upsert([{
                        id: projectId,
                        values: embedding,
                        metadata: {
                            title: projectTitle,
                            tech: projectTech,
                            frontend: projectFrontend,
                            backend: projectBackend,
                            db: projectDb,
                            infra: projectInfra
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