import React from 'react';
import ArticleCard from './ArticleCard.js';

const Article = ({article, ...otherProps}) => {
  return (
    <ArticleCard
      action={(id, article) => {
        otherProps.action(id, article);
      }}
      buttonText={otherProps.buttonText}
      onHover={otherProps.onHover}
      onMouseEnter={id => {
        otherProps.onMouseEnter(id);
      }}
      onMouseLeave={id => {
        otherProps.onMouseLeave(id);
      }}
      article={article}
      action2={(id, article) => {
        otherProps.action2(id, article);
      }}
      button2Text={otherProps.button2Text}
    />
  );
};

export default Article;
