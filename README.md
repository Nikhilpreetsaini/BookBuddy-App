# BookBuddy – Social Media for Book Lovers

BookBuddy is a community‑focused web application that lets you share your love of reading.  Inspired by the PawTrace stray‑animal platform, BookBuddy adapts the same features to the world of books: you can catalog the books around you, track your reading sessions, post reviews, build friendships with other readers, donate books or funds and climb the reading leaderboard.  All functionality is exposed through a RESTful API built with Node.js, Express and MongoDB.

## Features

### Book Management

* **Add and track books** – Create entries for books with a title, author, genre, description, location and optional cover photo.  Book owners earn reputation points for every book they add.
* **View all books** – Browse the list of books in the system and see who added them.

### Reading Logs & Streaks

* **Reading logs** – Record each time you read a book.  Logs support an optional photo and a note about your session.
* **Reading streaks** – The server automatically tracks consecutive days you read a particular book.  Maintain your streak to earn reputation points and climb the leaderboard.

### Social Feed

* **Posts & reviews** – Create posts that contain text, photos or videos.  Tag the books you’re reading, mark the post as a review and optionally geolocate it.
* **Like & comment** – Engage with other readers by liking their posts or leaving comments.
* **Newsfeed** – Fetch all posts, complete with author and tagged book information.

### Community

* **User profiles** – Register, log in, manage your profile and view your statistics.  All API endpoints that modify data require a valid JSON Web Token (JWT).
* **Friend connections** – Send, accept or reject friend requests to build your reading network.
* **Donations** – Support fellow readers by donating books or monetary points.  Donations increase the recipient’s reputation.
* **Leaderboard** – See the top readers (by reputation, books added and total reads) and the most popular books (by total reads and popularity).

## Getting Started

### Prerequisites

* [Node.js](https://nodejs.org/) (v18 or later)
* [MongoDB](https://www.mongodb.com/) (local or cloud instance)

### Installation

1. **Clone this repository**

   ```bash
   git clone https://github.com/your‑username/bookbuddy-app.git
   cd bookbuddy-app
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment variables**

   Create a `.env` file in the project root and define the following variables:

   ```env
   MONGODB_URI=mongodb://localhost:27017/bookbuddy
   JWT_SECRET=yourSecretKey
   PORT=5000
   ```

4. **Start the server**

   ```bash
   npm run dev
   ```

5. **Access the API**

   The API is served at `http://localhost:5000`.  Use tools like [Postman](https://www.postman.com/) to explore the endpoints.  The public directory includes a minimal front‑end you can open in your browser.

## Project Structure

```text
BookBuddy-App/
├── app.js               # Main application file defining routes and middleware
├── models/              # Mongoose models (User, Book, ReadLog, Streak, Post, Connection, Donation)
├── middleware/          # Authentication middleware
├── uploads/             # Uploaded photos and videos (ignored by Git)
├── public/              # Static assets and an example front‑end page
├── package.json         # Project metadata and scripts
└── README.md            # This documentation
```

## License

BookBuddy is provided under the MIT License.  See [LICENSE](LICENSE) for details.