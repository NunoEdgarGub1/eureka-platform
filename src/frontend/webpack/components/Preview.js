import React from 'react';
import styled from 'styled-components';
import {Card} from '../views/Card.js';
import {withRouter} from 'react-router-dom';
import {__GRAY_100, __GRAY_200} from '../../helpers/colors.js';
import {fetchArticle} from './TextEditor/DocumentMainMethods.js';
import Document from '../../../models/Document.mjs';
import {deserializeDocument} from '../../../helpers/documentSerializer.mjs';
import queryString from 'query-string';
import {getDomain} from '../../../helpers/getDomain.mjs';
import Modal from '../design-components/Modal.js';
import {renderField} from './TextEditor/DocumentRenderer.mjs';
import GridSpinner from '../views/spinners/GridSpinner.js';
import {Go} from './Routers/Go.js';
import Author from '../views/Author.js';

const Container = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
`;

const MySeparator = styled.div`
  height: 2px;

  display: flex;
  width: 75%;
  background: ${__GRAY_100};
  justify-content: center;
  margin-top: 25px;
`;

const MyPreview = styled.div`
  display: flex;
  padding: 20px;
  margin: 15px;
  width: 100%;
`;

const LeftSide = styled.div`
  flex: 1 1 0;
`;

const RightSide = styled.div`
  flex: 3.5 1 0;
  max-width: 820px;
`;

const Title = styled.h3`
  font-size: 26px;
  font-weight: bold;
  line-height: 1.3;
  font-family: 'Roboto', sans-serif;
  margin-bottom: 10px;
`;

class Preview extends React.Component {
  constructor() {
    super();
    this.state = {
      document: null,
      authorsData: null
    };
  }

  componentDidMount() {
    const draftId = this.props.match.params.id;
    fetchArticle(draftId)
      .then(response => response.json())
      .then(response => {
        if (response.success) {
          let document = new Document(response.data.document);
          let deserialized = deserializeDocument(document);
          this.setState({
            _id: response.data._id,
            document: deserialized
          });
          this.fetchAuthorsData();
        } else {
          this.setState({
            errorMessage: response.error
          });
        }
        this.setState({loading: false});
      })
      .catch(err => {
        console.log(err);
        this.setState({
          errorMessage: 'Ouh. Something went wrong.',
          loading: false
        });
      });
  }

  fetchAuthorsData() {
    const query = queryString.stringify({
      ethAddress: this.state.document.authors
    });

    fetch(`${getDomain()}/api/users?${query}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    })
      .then(response => response.json())
      .then(response => {
        if (response.success) {
          let authorsData = Array.isArray(response.data)
            ? response.data
            : [response.data];
          this.setState({authorsData});
        }
      })
      .catch(err => {
        console.error(err);
      });
  }

  renderModal() {
    return (
      <div>
        {' '}
        <Modal
          type={'notification'}
          toggle={isErrorMessage => {
            this.setState({errorMessage: null});
          }}
          show={this.state.errorMessage}
          title={'You got the following error'}
        >
          {this.state.errorMessage}
        </Modal>
      </div>
    );
  }

  render() {
    console.log(this.state.authorsData);
    return (
      <Container>
        {this.renderModal()}
        <Card width={1000} title={'Your article'}>
          <Go back {...this.props} />
          <MySeparator />
          {!this.state.document || !this.state.authorsData ? (
            <GridSpinner />
          ) : (
            <MyPreview>
              <LeftSide />
              <RightSide>
                <Title>{renderField(this.state.document, 'title')}</Title>
                {this.state.authorsData.map((author, i) => {
                  return (
                    <Author
                      right={15}
                      padding={'10px 0'}
                      key={i}
                      author={author}
                      height={25}
                      width={25}
                    />
                  );
                })}
              </RightSide>
            </MyPreview>
          )}
        </Card>
      </Container>
    );
  }
}

export default withRouter(Preview);
