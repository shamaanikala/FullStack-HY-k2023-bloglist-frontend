describe('Blog app', function() {
  beforeEach(function() {
    cy.request('POST', `${Cypress.env('BACKEND')}/testing/reset`)
    // const user = {
    //   name: 'Matti Meikäläinen',
    //   username: 'mmeika',
    //   password: 'salasana'
    // }
    // cy.request('POST', `${Cypress.env('BACKEND')}/users`, user)
    // cy.visit('')
    cy.createUser({ username: 'mmeika', name: 'Matti Meikäläinen', password: 'salasana' })
  })

  it('Login form is shown', function() {
    cy.get('html') // 'html' ~ näkyvät jutut
      .should('contain', 'log in to application')
      .and('not.contain', 'blogs')

    cy.contains('blogs').should('not.exist')

    // löytyykö itse lomake
    cy.get('form')
      .contains('username')
    cy.get('form')
      .should('contain', 'password')

    cy.get('form')
      .get('button')
      .should('have.text', 'login')
  })

  describe('Login',function() {
    it('succeeds with correct credentials', function() {
      cy.get('#username').type('mmeika')
      cy.get('#password').type('salasana')
      cy.contains('login').click()

      cy.contains('blogs')
      cy.contains('Matti Meikäläinen logged in')
    })

    it('fails with wrong credentials', function() {
      cy.get('#username').type('mmeika')
      cy.get('#password').type('väärä-salasana')
      cy.contains('login').click()

      //cy.contains('wrong username or password')
      cy.get('.error')
        .should('contain', 'wrong username or password')
        .and('have.css', 'color', 'rgb(255, 0, 0)')
        .and('have.css', 'border-style', 'solid')

      cy.get('html')
        .should('not.contain', 'Matti Meikäläinen')
        .and('not.contain', 'logged in')
        .and('contain', 'log in to application')
    })
  })

  describe('When logged in', function () {
    beforeEach(function () {
      cy.login({ username: 'mmeika', password: 'salasana' })
    })

    it('A blog can be created', function () {
      cy.contains('create new blog').click()

      cy.get('#title').type('Parsing Html The Cthulhu Way')
      cy.get('#author').type('Jeff Atwood')
      cy.get('#url').type('https://blog.codinghorror.com/parsing-html-the-cthulhu-way/')

      cy.get('#createButton').click()

      cy.contains('a new blog Parsing Html The Cthulhu Way by Jeff Atwood added')
      cy.contains('Parsing Html The Cthulhu Way')

      cy.get('.closed')
        .should('have.descendants','span').as('titleSpan')
      cy.get('@titleSpan').get('span')
        .should('have.class','blogTitle')
        .and('contain', 'Parsing Html The Cthulhu Way')
    })

    describe('when blog exists', function () {
      beforeEach(function () {
        cy.createBlog({
          title: 'Blog title',
          author: 'Blog author',
          url: 'http://localhost:3000'
        })
      })
      it('can be opened from view-button to show more information', function () {
        cy.contains('view').click()

        cy.contains('likes')
      })
      it('can be opened from title to show more information', function () {
        cy.get('.blogTitle').click()

        cy.contains('likes')
      })
      describe('and the blog is opened for more information', function ()  {
        beforeEach(function () {
          cy.contains('view').click()
        })
        it('can be liked', function () {
          // https://docs.cypress.io/faq/questions/using-cypress-faq#How-do-I-get-an-elements-text-contents
          cy.get('#likes')
            .invoke('text')
            .then(initialLikes => {
              cy.contains('like').click()

              cy.get('#likes')
                .invoke('text')
                .should(finalLikes => {
                  expect(Number(finalLikes)).to.eq(Number(initialLikes)+1)
                })
            })
        })
        it('can be liked twice', function () {
          cy.get('#likes')
            .invoke('text')
            .then(initialLikes => {
              cy.contains('like').click()
              //cy.contains('like').click() // löytää ilmoituksen "liked"
              //cy.wait(2000)

              // ei käytetä cy.wait() vaan odotetaan elementin muutosta
              cy.get('#likes')
                .invoke('text')
                .should('not.eq',initialLikes)

              cy.get('button').contains('like').click()

              cy.get('#likes')
                .invoke('text')
                .should(finalLikes => {
                  expect(Number(finalLikes)).to.eq(Number(initialLikes)+2)
                })
            })
        })
        it('can be removed by the user', function () {
          cy.get('.removeButton').click()

          cy.get('.blogAdded')
            .should('contain', 'Removed the blog')
            .and('have.css', 'color', 'rgb(0, 128, 0)')
            .and('have.css', 'border-style', 'solid')

          cy.get('html')
            .should('not.contain', 'Blog title')
            .and('not.contain', 'Blog author')
            .and('not.contain', 'view')
        })

        it.only('can only be removed by the user who created it', function () {
          cy.contains('logout').click()
          cy.createUser({ username: 'mluukkai', name: 'Matti Luukkainen', password: 'salainen' })
          cy.login({ username: 'mluukkai', password: 'salainen' })
          cy.contains('view').click()

          cy.get('.blogUser')
            .should('not.contain','Matti Luukkainen')
          cy.get('.removeButton').should('not.exist')
        })
      })
    })
  })
})