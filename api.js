const cors = require("cors");
const express = require("express");
const mysql = require("mysql2");

const functions = require("./inc/functions");
const mysql_config = require("./inc/mysql_config");

const API_AVAILABILITY = true;
const API_VERSION = "4.0.0";

const app = express();

app.listen(3000, () => {
  console.log("[SERVER]: Running on port 3000.");
});

app.use((req, res, next) => {
  if (API_AVAILABILITY) {
    next();
  } else {
    res.json(
      functions.response(
        "Atenção",
        "API está em manutenção. Sinto muito.",
        0,
        null
      )
    );
  }
});

const connection = mysql.createConnection(mysql_config);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// * Rotas
app.get("/", (req, res) => {
  res.json(functions.response("Sucesso", "API está rodando.", 0, null));
});

app.get("/tasks", (req, res) => {
  connection.query("SELECT * FROM tasks", (err, rows) => {
    if (err) {
      return res.json(functions.response("Erro", err.message, 0, null));
    }
    res.json(
      functions.response(
        "Sucesso",
        "Tasks retrieved successfully.",
        rows.length,
        rows
      )
    );
  });
});

app.get("/tasks/:id", (req, res) => {
  const id = req.params.id;
  connection.query("SELECT * FROM tasks WHERE id=?", [id], (err, rows) => {
    if (err) {
      return res.json(functions.response("Erro", err.message, 0, null));
    }
    if (rows.length > 0) {
      res.json(
        functions.response(
          "Sucesso",
          "Task retrieved successfully.",
          rows.length,
          rows
        )
      );
    } else {
      res.json(
        functions.response(
          "Atenção",
          "Não foi possível encontrar a task solicitada",
          0,
          null
        )
      );
    }
  });
});

app.put("/tasks/:id/status/:status", (req, res) => {
  const { id, status } = req.params;
  connection.query(
    "UPDATE tasks SET status = ? WHERE id = ?",
    [status, id],
    (err, result) => {
      if (err) {
        return res.json(functions.response("Erro", err.message, 0, null));
      }
      if (result.affectedRows > 0) {
        res.json(
          functions.response(
            "Sucesso",
            "Status atualizado com sucesso.",
            result.affectedRows,
            null
          )
        );
      } else {
        res.json(functions.response("Atenção", "Task não encontrada", 0, null));
      }
    }
  );
});

app.delete("/tasks/:id/delete", (req, res) => {
  const id = req.params.id;
  connection.query("DELETE FROM tasks WHERE id = ?", [id], (err, result) => {
    if (err) {
      return res.json(functions.response("Erro", err.message, 0, null));
    }
    if (result.affectedRows > 0) {
      res.json(
        functions.response(
          "Sucesso",
          "Task deletada com sucesso.",
          result.affectedRows,
          null
        )
      );
    } else {
      res.json(functions.response("Atenção", "Task não encontrada", 0, null));
    }
  });
});

app.post("/tasks/create", (req, res) => {
  const { task, status } = req.body;
  if (!task || !status) {
    return res.json(
      functions.response("Atenção", "Sem dados de uma nova task", 0, null)
    );
  }

  connection.query(
    "INSERT INTO tasks(task, status, created_at, updated_at) VALUES (?, ?, NOW(), NOW())",
    [task, status],
    (err, result) => {
      if (err) {
        return res.json(functions.response("Erro", err.message, 0, null));
      }
      res.json(
        functions.response(
          "Sucesso",
          "Task cadastrada com sucesso.",
          result.affectedRows,
          null
        )
      );
    }
  );
});

app.put("/tasks/:id/update", (req, res) => {
  const id = req.params.id;
  const { task, status } = req.body;

  if (!task || status === undefined) {
    return res.json(functions.response("Atenção", "Dados inválidos.", 0, null));
  }

  connection.query(
    "UPDATE tasks SET task = ?, status = ?, updated_at = NOW() WHERE id = ?",
    [task, status, id],
    (err, result) => {
      if (err) {
        return res.json(functions.response("Erro", err.message, 0, null));
      }
      if (result.affectedRows > 0) {
        res.json(
          functions.response(
            "Sucesso",
            "Task atualizada.",
            result.affectedRows,
            null
          )
        );
      } else {
        res.json(
          functions.response("Atenção", "Task não encontrada.", 0, null)
        );
      }
    }
  );
});

// * Middleware
app.use((req, res) => {
  res
    .status(404)
    .json(functions.response("Atenção", "Rota não encontrada.", 0, null));
});
