// consumers/consumer.js

const connect = require('amqplib').connect;
const Client = require('@elastic/elasticsearch').Client;
//const config = require('../config/local.json');

const RABBITMQ_URL = 'amqp://guest:guest@localhost:5672';
const ELASTICSEARCH_URL = 'http://elastic:tejas123@localhost:9200';
const ELASTICSEARCH_USERNAME = 'elastic';
const ELASTICSEARCH_PASSWORD = 'tejas123';
const QUEUE_NAME = 'planQueue';

if (!ELASTICSEARCH_URL) {
  throw new Error('Missing ELASTICSEARCH_URL in config');
}

let elasticClient;

if (ELASTICSEARCH_URL) {
  elasticClient = new Client({
    node: ELASTICSEARCH_URL,
    auth: {
      username: ELASTICSEARCH_USERNAME,
      password: ELASTICSEARCH_PASSWORD,
    },
  });
} else {
  throw new Error('Missing ELASTICSEARCH_URL environment variable');
}

const connectRabbitMQ = async () => {
  try {
    console.log('Connecting to RabbitMQ...');
    const connection = await connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertQueue(QUEUE_NAME, { durable: true });

    console.log(`Connected to RabbitMQ. Waiting for messages in ${QUEUE_NAME}. To exit press CTRL+C`);

    channel.consume(QUEUE_NAME, async (msg) => {
      if (msg !== null) {
        const messageContent = msg.content.toString();
        console.log(`Received message: ${messageContent}`);

        const message = JSON.parse(messageContent);

        // Store message in Elasticsearch
        console.log('Message received after parsing:', message);
        await storeInElasticsearch(message);

        channel.ack(msg);
      }
    });
  } catch (error) {
    console.error('Failed to connect to RabbitMQ', error);
  }
};

const storeInElasticsearch = async (message) => {
  try {
    const { action, data } = message;

    console.log('Action:', action);
    console.log('Data:', data);

    const storeDocument = async (doc, id, parent = null, relation = null) => {
      const body = {
        ...doc,
        plan_join: {
          name: relation,
          parent: parent ? parent : undefined,
        },
      };

      // Ensure the date format is correct
      if (body.creationDate) {
        body.creationDate = new Date(body.creationDate).toISOString().split('T')[0];
      }

      await elasticClient.index({
        index: 'plans',
        id: id,
        body: body,
        routing: parent || id, // Use parent ID for routing if available, otherwise use document ID
      });
      console.log(`Stored document in Elasticsearch: ${id}`);
    };

    const updateDocument = async (doc, id, parent = null) => {
      console.log(`Updating document in Elasticsearch: ${id}`);
      console.log(doc);

      // Ensure the date format is correct
      if (doc.creationDate) {
        doc.creationDate = new Date(doc.creationDate).toISOString().split('T')[0];
      }

      await elasticClient.update({
        index: 'plans',
        id: id,
        body: {
          doc: doc,
          doc_as_upsert: true,
        },
        routing: parent || id,
      });
      console.log(`Updated document in Elasticsearch: ${id}`);
    };

    const deleteDocument = async (id, parent = null) => {
      console.log(`Deleting document from Elasticsearch: ${id}`);
      await elasticClient.delete({
        index: 'plans',
        id: id.slice(5),
        routing: parent || id,
      });
      console.log(`Deleted document from Elasticsearch: ${id}`);
    };

    const deleteNestedDocuments = async (parentId) => {
      try {
        // Get the parent document
        const parentDoc = await elasticClient.get({
          index: 'plans',
          id: parentId.replace('plan_', '')
        });
    
        // Collect all nested document IDs
        const nestedDocsToDelete = [];
    
        // Add planCostShares if exists
        if (parentDoc._source.planCostShares) {
          nestedDocsToDelete.push(parentDoc._source.planCostShares.objectId);
        }
    
        // Add linkedPlanServices and their nested documents
        if (parentDoc._source.linkedPlanServices) {
          parentDoc._source.linkedPlanServices.forEach(service => {
            nestedDocsToDelete.push(service.objectId);
            if (service.planserviceCostShares) {
              nestedDocsToDelete.push(service.planserviceCostShares.objectId);
            }
            if (service.linkedService) {
              nestedDocsToDelete.push(service.linkedService.objectId);
            }
          });
        }
    
        // Perform bulk delete with correct routing
        if (nestedDocsToDelete.length > 0) {
          console.log(`Deleting nested documents: ${nestedDocsToDelete}`);
          
          const operations = nestedDocsToDelete.flatMap(id => ([
            {
              delete: {
                _index: 'plans',
                _id: id,
                routing: parentId.replace('plan_', '')
              }
            }
          ]));
    
          await elasticClient.bulk({
            refresh: true,
            operations
          });
    
          // Verify deletion
          const verifySearch = await elasticClient.search({
            index: 'plans',
            body: {
              query: {
                terms: {
                  _id: nestedDocsToDelete
                }
              }
            }
          });
    
          if (verifySearch.hits.total.value > 0) {
            console.warn('Some nested documents may not have been deleted');
          }
        }
    
        // Delete the parent document
        await elasticClient.delete({
          index: 'plans',
          id: parentId.replace('plan_', ''),
          refresh: true
        });
    
        console.log(`Deleted parent document and all nested documents: ${parentId}`);
      } catch (error) {
        console.error('Error deleting documents:', error);
        throw error;
      }
    };

   

    switch (action) {
      case 'create':
        // Store the main document
        await storeDocument(data, data.objectId, null, 'plan');

        // Store nested documents
        if (data.planCostShares) {
          await storeDocument(data.planCostShares, data.planCostShares.objectId, data.objectId, 'planCostShares');
        }

        if (data.linkedPlanServices) {
          for (const service of data.linkedPlanServices) {
            await storeDocument(service, service.objectId, data.objectId, 'linkedPlanService');
            if (service.planserviceCostShares) {
              await storeDocument(service.planserviceCostShares, service.planserviceCostShares.objectId, service.objectId, 'planserviceCostShares');
            }
            if (service.linkedService) {
              await storeDocument(service.linkedService, service.linkedService.objectId, service.objectId, 'linkedService');
            }
          }
        }
        break;

      case 'update':
        // Update the main document
        await updateDocument(data.planJSON, data.objectId, data.objectId);

        // Update nested documents
        if (data.planJSON.planCostShares) {
          await updateDocument(data.planJSON.planCostShares, data.planJSON.planCostShares.objectId, data.planJSON.objectId);
        }

        if (data.planJSON.linkedPlanServices) {
          for (const service of data.planJSON.linkedPlanServices) {
            await updateDocument(service, service.objectId, data.planJSON.objectId);

            if (service.planserviceCostShares) {
              await updateDocument(service.planserviceCostShares, service.planserviceCostShares.objectId, service.objectId);
            }

            if (service.linkedService) {
              await updateDocument(service.linkedService, service.linkedService.objectId, service.objectId);
            }
          }
        }
        break;

      case 'delete':
        // Delete nested documents
        const documentId = data.objectId.startsWith('plans_') ? data.objectId.slice(5) : data.objectId;

        await deleteNestedDocuments(documentId);

        // Delete the main document
        break;

      default:
        console.log(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('Failed to store message in Elasticsearch', error);
    console.error('Error details:', error.meta);
  }
};

connectRabbitMQ();