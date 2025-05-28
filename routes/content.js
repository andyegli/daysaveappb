const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const { check, validationResult } = require('express-validator');
const Content = require('../models/Content');
const Tag = require('../models/Tag');
const { Op } = require('sequelize');

// Get all content for a user
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const search = req.query.search || '';
    const tag = req.query.tag || '';
    const archived = req.query.archived === 'true';
    
    // Build filter conditions
    const where = {
      userId: req.user.id,
      isArchived: archived
    };
    
    if (search) {
      where.title = { [Op.like]: `%${search}%` };
    }
    
    let content = await Content.findAll({
      where,
      include: [{ model: Tag }],
      order: [['createdAt', 'DESC']]
    });
    
    // Filter by tag if specified
    if (tag) {
      content = content.filter(item => 
        item.Tags.some(t => t.name.toLowerCase() === tag.toLowerCase())
      );
    }
    
    // Get all tags for filter dropdown
    const tags = await Tag.findAll({
      order: [['name', 'ASC']]
    });
    
    res.render('content/index', {
      title: 'Content Management',
      content,
      tags,
      search,
      tag,
      archived
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error fetching content');
    res.redirect('/dashboard');
  }
});

// Show add content form
router.get('/add', ensureAuthenticated, async (req, res) => {
  try {
    const tags = await Tag.findAll({
      order: [['name', 'ASC']]
    });
    
    res.render('content/add', {
      title: 'Add Content',
      tags
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading form');
    res.redirect('/content');
  }
});

// Add content
router.post('/', ensureAuthenticated, [
  check('title', 'Title is required').not().isEmpty(),
  check('url', 'Valid URL is required').isURL()
], async (req, res) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    try {
      const tags = await Tag.findAll();
      return res.render('content/add', {
        title: 'Add Content',
        errors: errors.array(),
        content: req.body,
        tags
      });
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Error loading form');
      return res.redirect('/content');
    }
  }
  
  try {
    // Create content
    const content = await Content.create({
      title: req.body.title,
      url: req.body.url,
      comment: req.body.comment,
      userId: req.user.id
    });
    
    // Handle tags
    if (req.body.tags) {
      let tagIds = [];
      
      if (typeof req.body.tags === 'string') {
        req.body.tags = [req.body.tags];
      }
      
      for (const tagId of req.body.tags) {
        tagIds.push(parseInt(tagId));
      }
      
      await content.setTags(tagIds);
    }
    
    // Handle new tags
    if (req.body.newTags) {
      const newTagNames = req.body.newTags.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      
      for (const tagName of newTagNames) {
        const [tag] = await Tag.findOrCreate({
          where: { name: tagName }
        });
        
        await content.addTag(tag);
      }
    }
    
    req.flash('success_msg', 'Content added successfully');
    res.redirect('/content');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error adding content');
    res.redirect('/content/add');
  }
});

// Show edit content form
router.get('/edit/:id', ensureAuthenticated, async (req, res) => {
  try {
    const content = await Content.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: [{ model: Tag }]
    });
    
    if (!content) {
      req.flash('error_msg', 'Content not found');
      return res.redirect('/content');
    }
    
    const tags = await Tag.findAll({
      order: [['name', 'ASC']]
    });
    
    res.render('content/edit', {
      title: 'Edit Content',
      content,
      tags
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading edit form');
    res.redirect('/content');
  }
});

// Update content
router.put('/:id', ensureAuthenticated, [
  check('title', 'Title is required').not().isEmpty(),
  check('url', 'Valid URL is required').isURL()
], async (req, res) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    req.flash('error_msg', errors.array()[0].msg);
    return res.redirect(`/content/edit/${req.params.id}`);
  }
  
  try {
    const content = await Content.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });
    
    if (!content) {
      req.flash('error_msg', 'Content not found');
      return res.redirect('/content');
    }
    
    // Update content
    content.title = req.body.title;
    content.url = req.body.url;
    content.comment = req.body.comment;
    await content.save();
    
    // Handle tags
    if (req.body.tags) {
      let tagIds = [];
      
      if (typeof req.body.tags === 'string') {
        req.body.tags = [req.body.tags];
      }
      
      for (const tagId of req.body.tags) {
        tagIds.push(parseInt(tagId));
      }
      
      await content.setTags(tagIds);
    } else {
      await content.setTags([]);
    }
    
    // Handle new tags
    if (req.body.newTags) {
      const newTagNames = req.body.newTags.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      
      for (const tagName of newTagNames) {
        const [tag] = await Tag.findOrCreate({
          where: { name: tagName }
        });
        
        await content.addTag(tag);
      }
    }
    
    req.flash('success_msg', 'Content updated successfully');
    res.redirect('/content');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error updating content');
    res.redirect(`/content/edit/${req.params.id}`);
  }
});

// Archive/unarchive content
router.put('/archive/:id', ensureAuthenticated, async (req, res) => {
  try {
    const content = await Content.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });
    
    if (!content) {
      req.flash('error_msg', 'Content not found');
      return res.redirect('/content');
    }
    
    content.isArchived = !content.isArchived;
    await content.save();
    
    req.flash('success_msg', `Content ${content.isArchived ? 'archived' : 'unarchived'} successfully`);
    res.redirect('/content');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error updating content');
    res.redirect('/content');
  }
});

// Delete content
router.delete('/:id', ensureAuthenticated, async (req, res) => {
  try {
    const content = await Content.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });
    
    if (!content) {
      req.flash('error_msg', 'Content not found');
      return res.redirect('/content');
    }
    
    await content.destroy();
    
    req.flash('success_msg', 'Content deleted successfully');
    res.redirect('/content');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error deleting content');
    res.redirect('/content');
  }
});

module.exports = router;