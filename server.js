const express = require("express");
const cors = require("cors");
const neo4j = require("neo4j-driver");

const app = express();
app.use(cors());
app.use(express.json());

// --- Neo4j Aura credentials ---
const URI = ""; // Aura URI
const USER = "";                           // Aura username
const PASSWORD = "";                       // Aura password

let driver;

// Connect to Neo4j
(async () => {
  try {
    driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));
    const serverInfo = await driver.getServerInfo();
    console.log("✅ Connection established to Neo4j");
    console.log(serverInfo);
  } catch (err) {
    console.error(`❌ Connection error\n${err}\nCause: ${err.cause}`);
    process.exit(1);
  }
})();

// --- API Endpoint ---
app.get("/relationship", async (req, res) => {
  const { person1, person2 } = req.query;

  if (!person1 || !person2) {
    return res.status(400).json({ error: "Missing person names" });
  }

  const session = driver.session();
  try {
    const query = `
    MATCH (a:Person)-[r]-(b:Person)
    WHERE toLower(a.name) = toLower($name1)
        AND toLower(b.name) = toLower($name2)
    RETURN a.name AS fromName,
            a.bio AS fromBio,
            b.name AS toName,
            b.bio AS toBio,
            type(r) AS relationshipType,
            r.label AS relationshipLabel,
            r.description AS relationshipDescription,
            r.sources AS sources
    `;


    const result = await session.run(query, {
      name1: person1,
      name2: person2
    });

    if (result.records.length === 0) {
      return res.json({ relationship: "No relationship found" });
    }

    const relationships = result.records.map(record => ({
    fromName: record.get("fromName"),
    fromBio: record.get("fromBio"),
    toName: record.get("toName"),
    toBio: record.get("toBio"),
    relationshipType: record.get("relationshipType"),
    relationshipLabel: record.get("relationshipLabel"),
    relationshipDescription: record.get("relationshipDescription"),
    sources: record.get("sources")
    }));

    res.json({ relationships });
  } catch (err) {
    console.error("Query error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    await session.close();
  }
});

app.get("/download-data", async (req, res) => {
  const session = driver.session();
  try {
    const result = await session.run(`
      MATCH (n)
      OPTIONAL MATCH (n)-[r]->(m)
      RETURN 
        collect(DISTINCT {
          id: toString(id(n)),
          label: labels(n)[0],
          properties: properties(n)
        }) AS nodes,
        collect(DISTINCT {
          source: toString(id(startNode(r))),
          target: toString(id(endNode(r))),
          type: type(r),
          properties: properties(r)
        }) AS links
    `);

    // Extract the raw JavaScript objects from Neo4j's Record
    const { nodes, links } = result.records[0].toObject();

    res.json({ nodes, links });
  } catch (err) {
    console.error("Error fetching all data:", err);
    res.status(500).json({ error: "Failed to fetch data" });
  } finally {
    await session.close();
  }
});

app.get("/graph-data", (req, res) => {
  res.json({
    nodes: [
      { id: "1", label: "Person", name: "Alice" },
      { id: "2", label: "Person", name: "Bob" }
    ],
    links: [
      { source: "1", target: "2", type: "KNOWS" }
    ]
  });
});


app.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000");
});
