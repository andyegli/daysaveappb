# daysave.app, a content curateros dream

A web application for collecting and organizing social media content. Users can save, tag, and manage URLs to social media posts with custom titles, tags, and comments.

## Features

- User registration and authentication (email/password + social logins)
- Content submission with URL, title, tags, and comments
- Search and filter functionality for content
- Complete CRUD operations (create, read, update, delete)
- Content archiving system
- Responsive design optimized for all devices
- Password reset functionality

## Technologies Used

- **Backend**: Node.js, Express
- **Frontend**: EJS, Bootstrap 5
- **Database**: MySQL with Sequelize ORM
- **Authentication**: Passport.js with local and social strategies

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MySQL

### Installation

1. Clone the repository
```
git clone https://github.com/yourusername/social-content-cms.git
cd social-content-cms
```

2. Install dependencies
```
npm install
```

3. Create a `.env` file based on `.env.example` and fill in your details
```
cp .env.example .env
```

4. Create the MySQL database
```
CREATE DATABASE social_content_cms;
```
Note: Tables are created by Sqeualise

5. Start the development server
```
npm run dev
```

6. Visit `http://localhost:5001` in your browser

## Project Structure

```
social-content-cms/
├── config/             # Configuration files
├── middleware/         # Custom middleware
├── models/             # Database models
├── public/             # Static assets
├── routes/             # Route definitions
├── views/              # EJS templates
├── app.js              # Application entry point
├── package.json        # Project dependencies
└── README.md           # Project documentation
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.