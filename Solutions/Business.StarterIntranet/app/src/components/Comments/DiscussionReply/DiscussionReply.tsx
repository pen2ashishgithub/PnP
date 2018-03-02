import * as React from "react";
import IDiscussionReplyProps from "./IDiscussionReplyProps";
import { IDiscussionReplyState, EditMode } from "./IDiscussionReplyState";
import { PermissionKind } from "sp-pnp-js";
import { IDiscussionReply, DiscussionPermissionLevel } from "../../../models/IDiscussionReply";
import * as moment from "moment";

class DiscussionReply extends React.Component<IDiscussionReplyProps, IDiscussionReplyState> {

    public constructor() {
        super();

        this.state = {
            showInput: false,
            editMode: EditMode.NewComment,
            inputValue: "",
        };

        this.toggleInput = this.toggleInput.bind(this);
        this.onValueChange = this.onValueChange.bind(this);
    }

    public render() {

        let renderEdit = null;
        if (this.props.reply.UserPermissions.indexOf(DiscussionPermissionLevel.EditAsAuthor ) !== -1 || 
            this.props.reply.UserPermissions.indexOf(DiscussionPermissionLevel.ManageLists ) !== -1) {
            renderEdit = <a onClick={ () => {
                this.toggleInput(true, EditMode.UpdateComment);
            }}>Edit</a>;
        }

        let renderDelete = null;
        if (this.props.reply.UserPermissions.indexOf(DiscussionPermissionLevel.Delete) !== -1) {
            renderDelete = <a onClick={ () => { this.props.deleteReply(this.props.reply) }}>Delete</a>;
        }

        let renderReply = null;
        if (this.props.reply.UserPermissions.indexOf(DiscussionPermissionLevel.Add) !== -1) {
            renderReply = <a onClick={ () => {
                this.toggleInput(true, EditMode.NewComment);
            }}>Reply</a>;
        }

        let renderChildren: JSX.Element[] = [];
        if (this.props.reply.Children) {
            this.props.reply.Children.map((childReply, index) => {
                renderChildren.push(
                    <DiscussionReply 
                        key={ index }
                        reply={ childReply }
                        addNewReply={this.props.addNewReply}
                        deleteReply={ this.props.deleteReply }
                        updateReply={ this.props.updateReply }
                        toggleLikeReply={ this.props.toggleLikeReply }
                        />
                )
            });
        }

        let renderLike: JSX.Element = null;
        let likeLabel = this.isReplyLikedByCurrentUser(this.props.reply) ? "Unlike" : "Like";
        renderLike = <div>
                        <span>Number of likes  {this.props.reply.LikesCount}</span>
                        <a onClick={ () => { this.props.toggleLikeReply(this.props.reply, !this.isReplyLikedByCurrentUser(this.props.reply)) }}>{ likeLabel }</a>                        
                     </div>;

        const posted = moment(this.props.reply.Posted);
        const modified = moment(this.props.reply.Edited);
        let isPosthasBeenEdited: JSX.Element = modified.diff(posted) > 0 ? <div><strong>{`Edited (Last update on ${moment(modified).format("LLL")})`}</strong></div> : null;
        
        return  <div>
                    <img src={ this.props.reply.Author.PictureUrl}/>
                    <div>{ this.props.reply.Author.DisplayName }</div>
                    <div>{ `Posted on ${moment(this.props.reply.Posted).format('LLL')}`}</div>
                    { isPosthasBeenEdited }
                    <div dangerouslySetInnerHTML= {{__html: $(this.props.reply.Body).text() }}></div>
                    { renderEdit }                   
                    { renderDelete }
                    { renderReply }
                    { renderLike }
                    { this.state.showInput ? 
                        <div>
                            <textarea   value={ this.state.inputValue }
                                        placeholder="Add your comment..."
                                        onChange={ this.onValueChange }
                                        ></textarea>
                            <button type="button" onClick={ async () => {

                                switch (this.state.editMode) {
                                    case EditMode.NewComment:
                                        await this.props.addNewReply(this.props.reply.Id, this.state.inputValue);
                                        break;

                                    case EditMode.UpdateComment:

                                        if (this.state.inputValue.localeCompare($(this.props.reply.Body).text()) !== 0) {
                                            const reply: IDiscussionReply = {
                                                Id: this.props.reply.Id,
                                                Body: `<div>${this.state.inputValue}</div>`, // Set as HTML to be able to parse it easily afterward
                                            };

                                            await this.props.updateReply(reply);
                                        } else {
                                            alert("Please enter an other value for the comment");
                                        }
                                        break;
                                }

                                this.toggleInput(false, null);
                            }}>{ this.state.editMode === EditMode.UpdateComment ? "Update" : "Post" }</button>
                            <button onClick={ () => { this.toggleInput(false, null); }} >Annuler</button>
                            
                        </div>
                        : 
                            null
                    }
                    <div className="children-replies">
                        { renderChildren }
                    </div>
                </div>
    }

    public toggleInput(isVisible: boolean, editMode: EditMode) {

        let inputValue;

        switch (editMode) {
            case EditMode.UpdateComment:
                inputValue = $(this.props.reply.Body).text();
                break;

            case EditMode.NewComment:
                inputValue = "";
                break;
            
            default:
                inputValue = "";
                break;
        }

        this.setState({
            showInput: isVisible,
            editMode: editMode,
            inputValue: inputValue,
        });
    }

    public onValueChange(e: any) {

        this.setState({ 
            inputValue: e.target.value,
         });
    }


    private isReplyLikedByCurrentUser(reply: IDiscussionReply): boolean {

        // If the current user id is in the list ok "liked by" field
        let isLiked = false;
        if (reply.LikedBy.indexOf(_spPageContextInfo.userId.toString()) !== -1) {
            isLiked = true;
        }

        return isLiked;
    }
}

export default DiscussionReply;