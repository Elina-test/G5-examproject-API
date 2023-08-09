import { faker } from '@faker-js/faker';
import post from '../fixtures/post.json';
import user from '../fixtures/user.json';

post.userId = faker.number.int(10, 50);
post.title = faker.lorem.sentence({ min: 5, max: 10 });
post.body = faker.lorem.sentence({ min: 10, max: 15 });
user.email = faker.internet.email();
user.password = faker.internet.password({min_length: 8, max_length: 16, mix_case: true, special_characters: true});
post.id = faker.number.int(10001, 50000);


describe('JSON server tests', () => {
  it('Get all posts', () => {
    cy.request('GET', '/posts').then(response => {
      expect(response.isOkStatusCode).to.be.true;
      expect(response.status).to.be.equal(200);
      expect(response.headers['content-type']).to.include('application/json');
    })
  })

  it('Get only first 10 posts', () => {
    cy.request('GET', '/posts?_limit=10').then(response => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.lengthOf(10);
      expect(response.body[0]).to.have.property('id', 1);
    })
  })

  it('Get posts with id = 55 and id = 60', () => {
    cy.request('GET', '/posts?id=55&id=60').then(response => {
      const postIds = [55, 60];
      expect(response.status).to.eq(200);
      expect(response.body).to.have.lengthOf(2);
      const matchingPosts = response.body.filter(post => postIds.includes(post.id));
      matchingPosts.forEach(post => {
        expect(postIds).to.include(post.id);
      })
    })
  })

  it('Create post with error 401', () => {
    cy.request({
      method: 'POST',
      url: '/664/posts',
      body: {
        "userId": post.userId,
        "title": post.title,
        "body": post.body
      },
      failOnStatusCode: false
    }).then(response => {
      expect(response.status).to.eq(401);
    })
  })

  it('Registration', () => {
    let accessToken;
    cy.request({
      method: 'POST',
      url: '/register',
      body: {
        "email": user.email,
        "password": user.password
      },
      form: true,
    }).then(response => {
      expect(response.status).to.eq(201);
    }).then(() => {
      cy.request({
        method: 'POST',
        url: '/login',
        body: {
          "email": user.email,
          "password": user.password
        },
        form: true,
      }).then(response => {
        expect(response.status).to.eq(200);
        accessToken = response.body.accessToken;
      })
    })
    .then(() => {
      cy.request({
        method: 'POST',
        url: '/664/posts',
        body: {
          "userId": post.userId,
          "title": post.title,
          "body": post.body
        },
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
        failOnStatusCode: false
      }).then(response => {
        expect(response.status).to.eq(201);
        expect(response.body.title).to.eq(post.title);
        expect(response.body.body).to.eq(post.body);
        expect(response.body.userId).to.eq(post.userId);

      })
    })
  })

  it('Create post entity', () => {
    let createdPostId;
    cy.request({
      method: 'POST',
      url: '/posts',
      body: {
        "userId": post.userId,
        "title": post.title,
        "body": post.body
      },
    }).then(response => {
      expect(response.status).to.eq(201);
      createdPostId = response.body.id;
    }).then(() => {
      cy.request('GET', `/posts?id=${createdPostId}`).then(response => {
        expect(response.status).to.eq(200);
        expect(response.body[0]).to.have.property('id', createdPostId);
      })
    })
  })

  it('Update non-existing entity', () => {
    cy.request({
      method: 'PUT',
      url: `/posts/${post.id}`,
      body: {
        "title": post.title,
        "body": post.body
      },
      failOnStatusCode: false
    }).then(response => {
      expect(response.status).to.eq(404);
    })
  })

  it('Create post entity and update the created entity', () => {
    let createdPostforUpdateId;
      cy.request({
      method: 'POST',
      url: '/posts',
      body: {
        "userId": post.userId,
        "title": post.title,
        "body": post.body
      },
    }).then(response => {
      expect(response.status).to.eq(201);
      createdPostforUpdateId = response.body.id;
    }).then(() => {
      cy.request('GET', `/posts?id=${createdPostforUpdateId}`).then(response => {
        expect(response.status).to.eq(200);
        expect(response.body[0]).to.have.property('id', createdPostforUpdateId);
      })
    }).then(() => {
      cy.request({
      method: 'PUT',
      url: `/posts/${createdPostforUpdateId}`,
      body: {
        "title": post.title,
        "body": post.body
      },
    }).then(response => {
      expect(response.status).to.eq(200);
      expect(response.body.title).to.eq(post.title);
      expect(response.body.body).to.eq(post.body);
      expect(response.body).to.not.have.property('userId');
    })
  })
  })

  it('Delete non-existing entity', () => {
    cy.request({
      method: 'DELETE',
      url: `/posts/${post.id}`,
      failOnStatusCode: false
    }).then(response => {
      expect(response.status).to.eq(404);
    })
  })

  it('Create post entity and update the created entity and delete it', () => {
    let createdPostforUpdateAndDeleteId;
      cy.request({
      method: 'POST',
      url: '/posts',
      body: {
        "userId": post.userId,
        "title": post.title,
        "body": post.body
      },
    }).then(response => {
      expect(response.status).to.eq(201);
      createdPostforUpdateAndDeleteId = response.body.id;
    }).then(() => {
      cy.request('GET', `/posts?id=${createdPostforUpdateAndDeleteId}`).then(response => {
        expect(response.status).to.eq(200);
        expect(response.body[0]).to.have.property('id', createdPostforUpdateAndDeleteId);
      })
    }).then(() => {
      cy.request({
      method: 'PUT',
      url: `/posts/${createdPostforUpdateAndDeleteId}`,
      body: {
        "title": post.title,
        "body": post.body
      },
    }).then(response => {
      expect(response.status).to.eq(200);
      expect(response.body.title).to.eq(post.title);
      expect(response.body.body).to.eq(post.body);
      expect(response.body).to.not.have.property('userId');
    })
  }).then(() => {
    cy.request({
      method: 'DELETE',
      url: `/posts/${createdPostforUpdateAndDeleteId}`,
    }).then(response => {
      expect(response.status).to.eq(200);
    })
  }).then(() => {
    cy.request({
      method:'GET',
      url: `/posts?id=${createdPostforUpdateAndDeleteId}`,
      failOnStatusCode: false
    }).then(response => {
    expect(response.body).to.be.empty;
    })
  })
  })

})