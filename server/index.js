const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Qm1275834_',
  database: 'noteapp',
});

db.connect(err => {
  if (err) throw err;
  console.log('Connected to MySQL database');

  // Add a sample notification (ensure no duplicate entries)
  const sampleNotification = {
    message: 'This is a test notification',
    isRead: 0,
  };

  db.query(
    'SELECT COUNT(*) AS count FROM notifications WHERE message = ?',
    [sampleNotification.message],
    (err, results) => {
      if (err) return console.error('Error checking for duplicate notification:', err);

      if (results[0].count === 0) {
        db.query(
          'INSERT INTO notifications (message, isRead) VALUES (?, ?)',
          [sampleNotification.message, sampleNotification.isRead],
          (err) => {
            if (err) console.error('Failed to insert sample notification:', err);
            else console.log('Sample notification added');
          }
        );
      } else {
        console.log('Sample notification already exists');
      }
    }
  );
});

// Get all tasks
app.get('/api/tasks', (req, res) => {
  db.query('SELECT * FROM tasks', (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

// Add a new task
app.post('/api/tasks', (req, res) => {
  const { title, description, dueDate, priority } = req.body;
  db.query('INSERT INTO tasks (title, description, dueDate, priority) VALUES (?, ?, ?, ?)', 
    [title, description, dueDate, priority], 
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.json({ id: result.insertId, ...req.body });
    }
  );
});

// Delete a task
app.delete('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM tasks WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).send(err);
    res.sendStatus(204);
  });
});

// Get all events
app.get('/api/events', (req, res) => {
  db.query('SELECT * FROM events', (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

// Add a new event
app.post('/api/events', (req, res) => {
  const { title, description, startDate, endDate, location } = req.body;
  db.query('INSERT INTO events (title, description, startDate, endDate, location) VALUES (?, ?, ?, ?, ?)', 
    [title, description, startDate, endDate, location], 
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.json({ id: result.insertId, ...req.body });
    }
  );
});

// Delete an event
app.delete('/api/events/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM events WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).send(err);
    res.sendStatus(204);
  });
});

// Get all notifications
app.get('/api/notifications', (req, res) => {
  db.query('SELECT * FROM notifications', (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

// Mark a notification as read
app.put('/api/notifications/:id', (req, res) => {
  const { id } = req.params;
  db.query('UPDATE notifications SET isRead = 1 WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).send(err);
    res.sendStatus(200);
  });
});

app.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});
